import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { notifyCamSubmission } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ---- helpers ----
function pickText(form: FormData, keys: string[]) {
  for (const k of keys) {
    const v = form.get(k);
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return "";
}
function pickFile(form: FormData, keys: string[]) {
  for (const k of keys) {
    const v = form.get(k);
    if (v instanceof File) return v;
  }
  return null;
}
function pickFiles(form: FormData, keys: string[]) {
  const out: File[] = [];
  for (const k of keys) {
    for (const v of form.getAll(k)) if (v instanceof File) out.push(v);
  }
  return out;
}
function parseNum(s: string) {
  if (!s) return null;
  const cleaned = s.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
function extFromMime(mime: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, route: "/api/cam-submit", allowed: ["POST"] },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { ok: false, message: "Invalid Content-Type: must be multipart/form-data." },
        { status: 400 }
      );
    }

    const form = await req.formData();

    // DEBUG: log form entries (text values + file metadata only)
    try {
      const entries: any[] = [];
      for (const [k, v] of form.entries()) {
        if (v instanceof File) {
          entries.push({ key: k, file: { name: v.name, type: v.type, size: v.size } });
        } else {
          entries.push({ key: k, value: String(v).slice(0, 200) });
        }
      }
      console.log("DEBUG /api/cam-submit form entries:", JSON.stringify(entries));
    } catch (logErr) {
      console.log("DEBUG /api/cam-submit unable to enumerate form entries", String(logErr));
    }

    // ---- fields ----
    const cam_name = pickText(form, ["cam_name", "camName"]);
    const brand = pickText(form, ["brand"]);
    const part_number = pickText(form, ["part_number", "partNumber"]);

    const engine_make = pickText(form, ["engine_make", "engineMake"]);
    const engine_family = pickText(form, ["engine_family", "engineFamily"]);

    const lsa = parseNum(pickText(form, ["lsa", "LSA"]));
    const icl = parseNum(pickText(form, ["icl", "ICL"]));
    const rocker_ratio = parseNum(pickText(form, ["rocker_ratio", "rockerRatio"]));

    const duration_int_050 = parseNum(pickText(form, ["dur_int_050", "duration_int_050"]));
    const duration_exh_050 = parseNum(pickText(form, ["dur_exh_050", "duration_exh_050"]));

    const lift_int = parseNum(pickText(form, ["lift_int"]));
    const lift_exh = parseNum(pickText(form, ["lift_exh"]));

    const advertised_int = parseNum(pickText(form, ["adv_int", "advertised_int"]));
    const advertised_exh = parseNum(pickText(form, ["adv_exh", "advertised_exh"]));

    const lash_int = parseNum(pickText(form, ["lash_int"]));
    const lash_exh = parseNum(pickText(form, ["lash_exh"]));
    const rpm_start = parseNum(pickText(form, ["rpm_start", "cam_rpm_start", "rpmStart"]));
    const rpm_end = parseNum(pickText(form, ["rpm_end", "cam_rpm_end", "rpmEnd"]));

    const notes = pickText(form, ["notes"]);
    const user_id = pickText(form, ["user_id", "userId"]) || null;

    // ---- files ----
    const camCard = pickFile(form, ["cam_card", "camCard"]);
    const dynoFiles = pickFiles(form, ["dyno_sheets", "dynoSheets"]);

    if (!camCard) {
      return NextResponse.json(
        { ok: false, message: "cam_card file is required." },
        { status: 400 }
      );
    }

    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
    if (!allowed.has(camCard.type)) {
      return NextResponse.json(
        { ok: false, message: "Cam card must be PNG/JPG/WEBP/PDF.", got: camCard.type },
        { status: 400 }
      );
    }

    // REQUIRED core fields
    if (!cam_name || !brand || !part_number || !engine_make || !engine_family) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing required fields.",
          missing: {
            cam_name: !cam_name,
            brand: !brand,
            part_number: !part_number,
            engine_make: !engine_make,
            engine_family: !engine_family,
          },
        },
        { status: 400 }
      );
    }

    // ---- storage paths ----
    const id = randomUUID();
    const folder = user_id ? `${user_id}/${id}` : `${id}`;
    const safeBase =
      sanitizeFilename(`${brand}-${part_number}-${cam_name}`.slice(0, 120)) || "cam";

    const CAM_BUCKET = "cam_cards";
    const DYNO_BUCKET = "dyno_sheets";

    // upload cam card
    const camExt = extFromMime(camCard.type);
    const cam_card_path = `${folder}/${safeBase}-cam-card.${camExt}`;
    const camBuf = Buffer.from(await camCard.arrayBuffer());

    const upCam = await supabaseAdmin.storage.from(CAM_BUCKET).upload(cam_card_path, camBuf, {
      contentType: camCard.type,
      upsert: true,
    });

    if (upCam.error) {
      return NextResponse.json(
        { ok: false, message: "Failed to upload cam card.", error: upCam.error },
        { status: 500 }
      );
    }

    // upload dyno sheets
    const dyno_paths: string[] = [];
    for (let i = 0; i < dynoFiles.length; i++) {
      const f = dynoFiles[i];
      if (!allowed.has(f.type)) {
        return NextResponse.json(
          { ok: false, message: "Dyno files must be PNG/JPG/WEBP/PDF.", got: f.type },
          { status: 400 }
        );
      }

      const ext = extFromMime(f.type);
      const safeName = sanitizeFilename(f.name || `dyno-${i + 1}.${ext}`);
      const path = `${folder}/${safeBase}-dyno-${i + 1}-${safeName}`;
      const buf = Buffer.from(await f.arrayBuffer());

      const up = await supabaseAdmin.storage.from(DYNO_BUCKET).upload(path, buf, {
        contentType: f.type,
        upsert: true,
      });

      if (up.error) {
        return NextResponse.json(
          { ok: false, message: "Failed to upload dyno sheet.", file: f.name, error: up.error },
          { status: 500 }
        );
      }

      dyno_paths.push(path);
    }

    const spec = {
      cam_name,
      brand,
      part_number,
      engine_make,
      engine_family,
      lsa,
      icl,
      rocker_ratio,
      duration_int_050,
      duration_exh_050,
      lift_int,
      lift_exh,
      advertised_int,
      advertised_exh,
      lash_int,
      lash_exh,
      rpm_start,
      rpm_end,
      notes: notes || null,
      files: {
        cam_card: { name: camCard.name, type: camCard.type, size: camCard.size, path: cam_card_path },
        dyno: dyno_paths,
      },
    };

    const payload = {
      id,
      user_id,
      cam_name,
      brand,
      part_number,
      engine_make,
      engine_family,
      lsa,
      icl,
      rocker_ratio,
      duration_int_050,
      duration_exh_050,
      advertised_int,
      advertised_exh,
      lift_int,
      lift_exh,
      lash_int,
      lash_exh,
      rpm_start,
      rpm_end,
      notes: notes || null,
      cam_card_path,
      dyno_paths: dyno_paths.length ? dyno_paths : null,
      spec,
      status: "pending",
    };

    const { data, error } = await supabaseAdmin
      .from("cse_cam_submissions_table")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: "DB insert failed.", error },
        { status: 500 }
      );
    }

    // Award appreciation badge for camshaft submission
    if (user_id) {
      try {
        // Get the camshaft contributor award type
        const { data: awardType } = await supabaseAdmin
          .from("award_types")
          .select("id")
          .eq("slug", "camshaft_contributor")
          .single();

        if (awardType) {
          // Award the badge (will ignore if already exists due to UNIQUE constraint)
          await supabaseAdmin
            .from("user_awards")
            .insert({
              user_id,
              award_type_id: awardType.id,
              submission_id: data.id,
              submission_type: "camshaft",
            })
            .select();
        }
      } catch (awardError) {
        console.error("Error awarding badge:", awardError);
        // Don't fail the submission if award fails
      }
    }

    // Send email notification
    try {
      await notifyCamSubmission({
        submissionId: data.id,
        brand,
        camName: cam_name,
        partNumber: part_number,
        engineMake: engine_make,
        engineFamily: engine_family,
        durationInt: duration_int_050 ? parseFloat(duration_int_050) : undefined,
        durationExh: duration_exh_050 ? parseFloat(duration_exh_050) : undefined,
        liftInt: lift_int ? parseFloat(lift_int) : undefined,
        liftExh: lift_exh ? parseFloat(lift_exh) : undefined,
        lsa: lsa ? parseFloat(lsa) : undefined,
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't fail submission if email fails
    }

    return NextResponse.json({ ok: true, submission: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
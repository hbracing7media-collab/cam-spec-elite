import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase environment variables");

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

async function uploadFile(
  supabase: ReturnType<typeof getSupabase>,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

function safeName(n: string): string {
  return n.replace(/[^\w.\-]+/g, "_");
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: false }, { status: 500 });

  try {
    const supabase = getSupabase(req, res);

    // Cookie-auth
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = auth.user;

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // We insert into the REAL table (not the VIEW)
    const TABLE = "cse_cam_submissions_table";

    // ====== CASE 1: multipart/form-data (preferred: includes files) ======
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();

      const cam_name = String(form.get("cam_name") || "").trim();
      const engine_make = String(form.get("engine_make") || "").trim();
      const engine_family = String(form.get("engine_family") || "").trim();
      const notes = String(form.get("notes") || "").trim();

      if (!cam_name) {
        return NextResponse.json({ ok: false, error: "cam_name is required" }, { status: 400 });
      }

      const camCard = form.get("cam_card");
      if (!(camCard instanceof File)) {
        return NextResponse.json({ ok: false, error: "Cam card is required" }, { status: 400 });
      }

      let spec: unknown = null;
      const rawSpec = form.get("spec_json");
      if (typeof rawSpec === "string" && rawSpec.trim()) {
        try { spec = JSON.parse(rawSpec); } catch { spec = null; }
      }

      const ts = Date.now();

      // Upload cam card
      const camCardPath = `${user.id}/${ts}_camcard_${safeName(camCard.name)}`;
      await uploadFile(supabase, "cam_cards", camCardPath, camCard);

      // Upload dyno sheets
      const dynoFiles = form.getAll("dyno_sheets");
      const dynoPaths: string[] = [];

      for (let i = 0; i < dynoFiles.length; i++) {
        const f = dynoFiles[i];
        if (!(f instanceof File)) continue;
        const p = `${user.id}/${ts}_dyno_${i + 1}_${safeName(f.name)}`;
        await uploadFile(supabase, "dyno_sheets", p, f);
        dynoPaths.push(p);
      }

      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          cam_name,
          engine_make: engine_make || null,
          engine_family: engine_family || null,
          notes: notes || null,
          cam_card_path: camCardPath,
          dyno_paths: dynoPaths.length ? dynoPaths : null,
          spec: spec ?? null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

      return NextResponse.json({ ok: true, id: data?.id ?? null, mode: "multipart" });
    }

    // ====== CASE 2: application/json (fallback so you don’t get blocked) ======
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({} as any))) as any;

      const cam_name = String(body.cam_name || "").trim();
      const engine_make = String(body.engine_make || "").trim();
      const engine_family = String(body.engine_family || "").trim();
      const notes = String(body.notes || "").trim();
      const spec = body.spec ?? body.spec_json ?? null;

      if (!cam_name) {
        return NextResponse.json({ ok: false, error: "cam_name is required" }, { status: 400 });
      }

      // JSON mode cannot include files; we still store the submission.
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          cam_name,
          engine_make: engine_make || null,
          engine_family: engine_family || null,
          notes: notes || null,
          cam_card_path: null,
          dyno_paths: null,
          spec: spec ?? null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

      return NextResponse.json({
        ok: true,
        id: data?.id ?? null,
        mode: "json",
        warning: "JSON submission saved without files. Use the submit page to upload cam card/dyno sheets.",
      });
    }

    // ====== Unsupported types ======
    return NextResponse.json(
      { ok: false, error: `Invalid Content-Type: ${ct}. Use multipart/form-data or application/json.` },
      { status: 415 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

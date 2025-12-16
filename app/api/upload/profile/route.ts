import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB avatars
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const BUCKET = process.env.SUPABASE_PROFILE_BUCKET ?? "profile-avatars";

    const authHeader = req.headers.get("authorization") || "";
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token." },
        { status: 401 }
      );
    }
    const accessToken = tokenMatch[1];

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded. Provide a 'file' field." },
        { status: 400 }
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported type: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 5MB)." },
        { status: 400 }
      );
    }

    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : "webp";

    const userId = userData.user.id;
    const path = `${userId}/avatar.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true, // overwrite old avatar
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      path,
      publicUrl: pub?.publicUrl ?? null,
      userId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Avatar upload failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // needed for Buffer

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY"); // server-only
    const BUCKET = process.env.SUPABASE_FORUM_BUCKET ?? "forum-images";

    // Require Authorization: Bearer <access_token>
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

    // Verify user from token
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      accessToken
    );
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
        { error: "No file uploaded. Provide a 'file' field in form-data." },
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
        { error: `File too large. Max ${Math.floor(MAX_BYTES / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    // Build a safe storage path
    const ext = file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
      ? "webp"
      : file.type === "image/gif"
      ? "gif"
      : "bin";

    const userId = userData.user.id;
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const rand = Math.random().toString(16).slice(2);
    const path = `${userId}/${yyyy}/${mm}/${dd}/${Date.now()}-${rand}.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Public URL works only if bucket is Public
    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      bucket: BUCKET,
      path,
      publicUrl: pub?.publicUrl ?? null,
      userId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Upload failed." },
      { status: 500 }
    );
  }
}

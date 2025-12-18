import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    // ...existing upload logic...
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, message: "Upload failed.", error: message },
      { status: 500 }
    );
  }
}
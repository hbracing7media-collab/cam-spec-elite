import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("cse_cam_submissions_table")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "Failed to fetch submissions.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, submissions: data || [] }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body as { id: string; action: string };

    if (!id || !action) {
      return NextResponse.json(
        { ok: false, message: "Missing id or action." },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : action === "deny" ? "denied" : null;
    if (!newStatus) {
      return NextResponse.json(
        { ok: false, message: "Invalid action. Use 'approve' or 'deny'." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cse_cam_submissions_table")
      .update({ status: newStatus })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: "Failed to update submission.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, submission: data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: message },
      { status: 500 }
    );
  }
}
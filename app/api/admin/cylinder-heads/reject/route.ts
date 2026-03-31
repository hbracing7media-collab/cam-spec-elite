import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return NextResponse.json({ ok: false, message: "Missing submission_id" }, { status: 400 });
    }

    // Update status to rejected
    const { data, error } = await supabase
      .from("cylinder_heads")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", submission_id)
      .select()
      .single();

    if (error) {
      console.error("Reject error:", error);
      return NextResponse.json({ ok: false, message: "Failed to reject: " + error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, message: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Head rejected successfully" });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: false, message: "Error rejecting submission" }, { status: 500 });
  }
}

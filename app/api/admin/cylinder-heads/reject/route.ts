import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    // TODO: Add admin auth check here
    const { submission_id } = await req.json();

    // Update status to rejected
    const { error } = await supabase
      .from("cylinder_heads_submissions")
      .update({ status: "rejected" })
      .eq("id", submission_id);

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: false, message: "Error rejecting submission" }, { status: 500 });
  }
}

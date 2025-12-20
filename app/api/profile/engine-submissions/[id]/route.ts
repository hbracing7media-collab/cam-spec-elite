import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = await cookies();

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    // Check if submission belongs to user and is pending
    const { data: submission, error: fetchError } = await supabase
      .from("user_engine_submissions")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ ok: false, message: "Submission not found" }, { status: 404 });
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
    }

    if (submission.status !== "pending") {
      return NextResponse.json(
        { ok: false, message: "Can only delete pending submissions" },
        { status: 400 }
      );
    }

    // Delete submission
    const { error: deleteError } = await supabase
      .from("user_engine_submissions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting submission:", deleteError);
      return NextResponse.json({ ok: false, message: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

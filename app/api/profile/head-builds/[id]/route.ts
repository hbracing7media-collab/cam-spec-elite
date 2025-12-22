import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const body = await req.json();
    const { head_id } = body;

    console.log(`[PUT] Updating head build ${id} for user ${user.id}: head_id=${head_id}`);

    // Verify ownership
    const { data: build, error: fetchError } = await supabase
      .from("user_head_builds")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !build) {
      console.log(`[PUT] Build not found: fetchError=${fetchError?.message}, build=${build}`);
      return NextResponse.json({ ok: false, message: "Build not found or unauthorized" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("user_head_builds")
      .update({
        head_id: head_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PUT] Error updating head build:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    console.log(`[PUT] Successfully updated head build ${id}:`, updated);
    return NextResponse.json({ ok: true, build: updated });
  } catch (err: any) {
    console.error("[PUT] Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

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
    const { error } = await supabase
      .from("user_head_builds")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting head build:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

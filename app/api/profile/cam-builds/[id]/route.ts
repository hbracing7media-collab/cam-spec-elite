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
    const { cam1_id, cam2_id, cam3_id } = body;
    
    console.log(`[PUT] Updating cam build ${id} for user ${user.id}:`, { cam1_id, cam2_id, cam3_id });

    // Verify ownership
    const { data: build, error: fetchError } = await supabase
      .from("user_cam_builds")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !build) {
      console.log(`[PUT] Build not found: fetchError=${fetchError?.message}, build=${build}`);
      return NextResponse.json({ ok: false, message: "Build not found or unauthorized" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("user_cam_builds")
      .update({
        cam1_id: cam1_id || null,
        cam2_id: cam2_id || null,
        cam3_id: cam3_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PUT] Error updating cam build:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    console.log(`[PUT] Successfully updated cam build ${id}:`, updated);
    return NextResponse.json({ ok: true, build: updated });
  } catch (err: any) {
    console.error("[PUT] Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(
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
    console.log(`[DELETE] Deleting cam build ${id} for user ${user.id}`);
    
    // Verify ownership
    const { data: build, error: fetchError } = await supabase
      .from("user_cam_builds")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !build) {
      console.log(`[DELETE] Build not found: fetchError=${fetchError?.message}, build=${build}`);
      return NextResponse.json({ ok: false, message: "Build not found or unauthorized" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("user_cam_builds")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE] Error deleting cam build:", deleteError);
      return NextResponse.json({ ok: false, message: deleteError.message }, { status: 400 });
    }

    console.log(`[DELETE] Successfully deleted cam build ${id}`);
    return NextResponse.json({ ok: true, message: "Build deleted" });
  } catch (err: any) {
    console.error("[DELETE] Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

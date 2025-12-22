import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
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
    const { data: builds, error } = await supabase
      .from("user_cam_builds")
      .select(`
        *,
        cam1:cam1_id(id, cam_name, brand, part_number),
        cam2:cam2_id(id, cam_name, brand, part_number),
        cam3:cam3_id(id, cam_name, brand, part_number)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cam builds:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    console.log("Loaded cam builds for user:", user.id, JSON.stringify(builds, null, 2));
    return NextResponse.json({ ok: true, builds: builds || [] });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = await cookies();

  if (!supabaseUrl || !serviceRole) {
    console.error("Server misconfigured: missing env vars");
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) {
    console.warn("No access token found");
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    console.error("User auth error:", userError);
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { short_block_id, cam1_id, cam2_id, cam3_id } = body;

    console.log("Creating cam build for user:", user.id, "block:", short_block_id);

    if (!short_block_id) {
      return NextResponse.json({ ok: false, message: "Short block ID is required" }, { status: 400 });
    }

    // Verify the short block belongs to the user
    const { data: block, error: blockError } = await supabase
      .from("user_short_blocks")
      .select("id")
      .eq("id", short_block_id)
      .eq("user_id", user.id)
      .single();

    if (blockError) {
      console.error("Block lookup error:", blockError);
      return NextResponse.json({ ok: false, message: "Short block not found: " + blockError.message }, { status: 404 });
    }

    if (!block) {
      console.warn("Block not found for user");
      return NextResponse.json({ ok: false, message: "Short block not found" }, { status: 404 });
    }

    console.log("Block found, creating cam build...");

    const { data: newBuild, error } = await supabase
      .from("user_cam_builds")
      .insert({
        user_id: user.id,
        short_block_id,
        cam1_id: cam1_id || null,
        cam2_id: cam2_id || null,
        cam3_id: cam3_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ ok: false, message: "Error creating cam build: " + error.message }, { status: 400 });
    }

    console.log("Build created successfully:", newBuild.id);
    return NextResponse.json({ ok: true, build: newBuild });
  } catch (err: any) {
    console.error("Exception in POST /cam-builds:", err);
    return NextResponse.json({ ok: false, message: "Server error: " + err.message }, { status: 500 });
  }
}

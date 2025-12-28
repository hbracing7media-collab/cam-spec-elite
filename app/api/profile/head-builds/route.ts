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
      .from("user_head_builds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching head builds:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    // Fetch head details for each build
    const buildsWithHeads = await Promise.all(
      (builds || []).map(async (build: any) => {
        console.log(`[HEAD-BUILDS GET] Fetching head for build ${build.id}, head_id: ${build.head_id}`);
        const { data: head, error: headError } = await supabase
          .from("cylinder_heads")
          .select("id, brand, part_number, engine_make, engine_family, intake_valve_size, exhaust_valve_size, max_lift, max_rpm, intake_runner_cc, chamber_cc, notes")
          .eq("id", build.head_id)
          .single();
        
        if (headError) {
          console.error(`[HEAD-BUILDS GET] Error fetching head:`, headError);
        } else {
          console.log(`[HEAD-BUILDS GET] Head fetched:`, head);
        }
        
        return {
          ...build,
          cylinder_heads: head,
        };
      })
    );

    console.log("Loaded head builds for user:", user.id, JSON.stringify(buildsWithHeads, null, 2));
    return NextResponse.json({ ok: true, builds: buildsWithHeads || [] });
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
    const { short_block_id, head_id } = body;

    console.log(`[HEAD-BUILDS POST] user: ${user.id}, short_block_id: ${short_block_id}, head_id: ${head_id}`);

    if (!short_block_id || !head_id) {
      console.log(`[HEAD-BUILDS POST] Missing required fields: short_block_id=${short_block_id}, head_id=${head_id}`);
      return NextResponse.json(
        { ok: false, message: "short_block_id and head_id are required" },
        { status: 400 }
      );
    }

    // Verify the short block belongs to the user
    const { data: block, error: blockError } = await supabase
      .from("user_short_blocks")
      .select("id")
      .eq("id", short_block_id)
      .eq("user_id", user.id)
      .single();

    if (blockError || !block) {
      console.error("[HEAD-BUILDS POST] Block not found or doesn't belong to user:", blockError?.message);
      return NextResponse.json({ ok: false, message: "Short block not found or unauthorized" }, { status: 404 });
    }

    // Verify the head exists in cylinder_heads table
    const { data: head, error: headError } = await supabase
      .from("cylinder_heads")
      .select("id")
      .eq("id", head_id)
      .single();

    if (headError || !head) {
      console.error("[HEAD-BUILDS POST] Head not found:", headError?.message);
      return NextResponse.json({ ok: false, message: "Cylinder head not found" }, { status: 404 });
    }

    const { data: newBuild, error } = await supabase
      .from("user_head_builds")
      .insert({
        user_id: user.id,
        short_block_id,
        head_id,
      })
      .select()
      .single();

    if (error) {
      console.error("[HEAD-BUILDS POST] Error creating head build:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    console.log(`[HEAD-BUILDS POST] Successfully created head build:`, newBuild);
    return NextResponse.json({ ok: true, build: newBuild });
  } catch (err: any) {
    console.error("[HEAD-BUILDS POST] Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

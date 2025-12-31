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

    // Fetch short blocks with head builds (including flow data)
    const { data: blocks, error } = await supabase
      .from("user_short_blocks")
      .select(`*, user_head_builds!left(id, head_id, cylinder_heads!inner(id, brand, part_number, engine_make, engine_family, intake_valve_size, exhaust_valve_size, max_lift, max_rpm, intake_runner_cc, chamber_cc, notes, flow_curve:cylinder_heads_flow_data(lift,intake_flow,exhaust_flow)))`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blocks:", error);
      return NextResponse.json({ ok: false, message: error.message, details: error }, { status: 400 });
    }

    // Fetch all cam builds for these blocks
    const blockIds = (blocks || []).map((b: any) => b.id);
    let camBuilds: any[] = [];
    if (blockIds.length > 0) {
      const { data: camBuildRows, error: camBuildsError } = await supabase
        .from("user_cam_builds")
        .select(`id, short_block_id, cam1:cam1_id(*), cam2:cam2_id(*), cam3:cam3_id(*)`)
        .in("short_block_id", blockIds);
      if (camBuildsError) {
        console.error("Error fetching cam builds:", camBuildsError);
      } else {
        camBuilds = camBuildRows || [];
      }
    }

    if (error) {
      console.error("Error fetching blocks:", error);
      return NextResponse.json({ ok: false, message: error.message, details: error }, { status: 400 });
    }

    if (!blocks) {
      console.error("No blocks returned from Supabase");
      return NextResponse.json({ ok: false, message: "No blocks returned from Supabase" }, { status: 500 });
    }

    // Attach the most recent head build and cam builds to each block
    const blocksWithHeadsAndCams = (blocks || []).map((block: any) => {
      // Attach head
      let attachedHead = null;
      if (block.user_head_builds && Array.isArray(block.user_head_builds) && block.user_head_builds.length > 0) {
        const sorted = [...block.user_head_builds].sort((a, b) => {
          if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return 0;
        });
        const headBuild = sorted[0];
        if (headBuild && headBuild.cylinder_heads) {
          const ch = headBuild.cylinder_heads;
          // Transform flow_curve from DB format to calculator format
          const flow_data = Array.isArray(ch.flow_curve) 
            ? ch.flow_curve.map((row: any) => ({
                lift: Number(row.lift) || 0,
                intakeFlow: row.intake_flow != null ? Number(row.intake_flow) : undefined,
                exhaustFlow: row.exhaust_flow != null ? Number(row.exhaust_flow) : undefined,
              })).sort((a: any, b: any) => a.lift - b.lift)
            : [];
          attachedHead = {
            ...ch,
            chamber_volume: ch.chamber_cc,
            chamber_cc: ch.chamber_cc,
            intake_ports: ch.intake_ports,
            exhaust_ports: ch.exhaust_ports,
            flow_data,
            flow_curve: undefined, // Remove raw DB format
          };
        }
      }
      // Attach cams
      const blockCamBuilds = camBuilds.filter((cb) => cb.short_block_id === block.id);
      // Flatten all cam slots into a single array, filter out nulls
      const attachedCams = blockCamBuilds.flatMap((cb) => [cb.cam1, cb.cam2, cb.cam3]).filter(Boolean);
      return {
        ...block,
        attachedHead,
        attachedCams,
        user_head_builds: undefined,
      };
    });

    return NextResponse.json({ ok: true, blocks: blocksWithHeadsAndCams });
  } catch (err: any) {
    console.error("Exception in /api/profile/short-blocks:", err);
    return NextResponse.json({ ok: false, message: err.message, stack: err.stack }, { status: 500 });
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
    const {
      block_name,
      engine_make,
      engine_family,
      displacement,
      bore,
      stroke,
      deck_height,
      piston_dome_dish,
      head_gasket_bore,
      head_gasket_compressed_thickness,
      rod_length,
    } = body;

    if (!block_name) {
      return NextResponse.json({ ok: false, message: "Block name is required" }, { status: 400 });
    }

    const { data: newBlock, error } = await supabase
      .from("user_short_blocks")
      .insert({
        user_id: user.id,
        block_name,
        engine_make,
        engine_family,
        displacement,
        bore,
        stroke,
        deck_height,
        piston_dome_dish,
        head_gasket_bore,
        head_gasket_compressed_thickness,
        rod_length,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating block:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, block: newBlock });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

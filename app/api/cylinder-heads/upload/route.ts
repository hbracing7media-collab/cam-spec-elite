import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, message: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const fd = await req.formData();
    const brand = fd.get("brand") as string;
    const partNumber = fd.get("part_number") as string;
    const partName = fd.get("part_name") as string;
    const location = fd.get("location") as string;
    const engineMake = fd.get("engine_make") as string;
    const engineFamily = fd.get("engine_family") as string;
    const intakeValveSize = fd.get("intake_valve_size");
    const exhaustValveSize = fd.get("exhaust_valve_size");
    const maxLift = fd.get("max_lift");
    const maxRpm = fd.get("max_rpm");
    const intakeRunnerCc = fd.get("intake_runner_cc");
    const chamberCc = fd.get("chamber_cc");
    const notes = fd.get("notes") as string;
    const flowDataJson = fd.get("flow_data") as string;

    // Parse flow data
    let flowData: Array<{ lift: number; intakeFlow: number; exhaustFlow: number }> = [];
    try {
      flowData = JSON.parse(flowDataJson || "[]");
    } catch (e) {
      flowData = [];
    }

    // Validate required fields
    if (!brand || !partNumber || !partName || !location || !engineMake || !engineFamily) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert head into cylinder_heads table
    const { data: headData, error: headError } = await supabase
      .from("cylinder_heads")
      .insert({
        brand,
        part_number: partNumber,
        part_name: partName,
        location,
        engine_make: engineMake,
        engine_family: engineFamily,
        intake_valve_size: intakeValveSize ? parseFloat(intakeValveSize as string) : null,
        exhaust_valve_size: exhaustValveSize ? parseFloat(exhaustValveSize as string) : null,
        max_lift: maxLift ? parseFloat(maxLift as string) : null,
        max_rpm: maxRpm ? parseFloat(maxRpm as string) : null,
        intake_runner_cc: intakeRunnerCc ? parseFloat(intakeRunnerCc as string) : null,
        chamber_cc: chamberCc ? parseFloat(chamberCc as string) : null,
        notes,
        status: "pending",
      })
      .select();

    if (headError || !headData || headData.length === 0) {
      return NextResponse.json(
        { ok: false, message: headError?.message || "Failed to insert head" },
        { status: 500 }
      );
    }

    const headId = headData[0].id;

    // Insert flow data points
    if (flowData.length > 0) {
      const flowInserts = flowData.map((point) => ({
        head_id: headId,
        lift: parseFloat(point.lift as any),
        intake_flow: parseFloat(point.intakeFlow as any),
        exhaust_flow: parseFloat(point.exhaustFlow as any),
      }));

      const { error: flowError } = await supabase
        .from("cylinder_heads_flow_data")
        .insert(flowInserts);

      if (flowError) {
        console.error("Flow data insert error:", flowError);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Head submission received and pending admin approval",
      headId,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

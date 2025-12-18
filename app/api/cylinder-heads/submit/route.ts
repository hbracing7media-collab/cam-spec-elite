import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

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

    const body = await req.json();
    console.log("Submit API received:", body);
    
    const {
      user_id,
      brand,
      part_number,
      part_name,
      engine_make,
      engine_family,
      intake_valve_size,
      exhaust_valve_size,
      max_lift,
      max_rpm,
      intake_runner_cc,
      chamber_cc,
      flow_data,
      notes,
    } = body;

    // Validate required fields
    if (!brand || !part_number || !part_name || !engine_make || !engine_family) {
      console.log("Missing required fields:", { brand, part_number, part_name, engine_make, engine_family });
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate UUID for the head
    const headId = randomUUID();

    // Insert head submission
    const { data: head, error: headError } = await supabase
      .from("cylinder_heads")
      .insert({
        id: headId,
        brand,
        part_number,
        part_name,
        engine_make,
        engine_family,
        intake_valve_size: intake_valve_size ? parseFloat(intake_valve_size) : null,
        exhaust_valve_size: exhaust_valve_size ? parseFloat(exhaust_valve_size) : null,
        max_lift: max_lift ? parseFloat(max_lift) : null,
        max_rpm: max_rpm ? parseFloat(max_rpm) : null,
        intake_runner_cc: intake_runner_cc ? parseFloat(intake_runner_cc) : null,
        chamber_cc: chamber_cc ? parseFloat(chamber_cc) : null,
        notes,
        status: "pending",
        created_by: user_id,
      })
      .select()
      .single();

    if (headError) {
      console.error("Head insert error:", headError);
      return NextResponse.json(
        { ok: false, message: `Database error: ${headError.message}` },
        { status: 400 }
      );
    }

    console.log("Head created:", head.id);

    // Insert flow data points
    if (flow_data && Array.isArray(flow_data) && flow_data.length > 0) {
      console.log("Raw flow_data received:", JSON.stringify(flow_data, null, 2));
      
      const flowDataRecords = flow_data.map((fd: any) => ({
        head_id: head.id,
        lift: fd.lift ? parseFloat(fd.lift) : null,
        intake_flow: fd.intakeFlow ? parseFloat(fd.intakeFlow) : null,
        exhaust_flow: fd.exhaustFlow ? parseFloat(fd.exhaustFlow) : null,
      }));

      console.log("Formatted flow data records:", JSON.stringify(flowDataRecords, null, 2));

      const { data: insertedData, error: flowError } = await supabase
        .from("cylinder_heads_flow_data")
        .insert(flowDataRecords)
        .select();

      if (flowError) {
        console.error("Flow data insert error:", JSON.stringify(flowError, null, 2));
        return NextResponse.json({
          ok: false,
          message: `Flow data error: ${flowError.message}`,
          head_id: head.id,
        }, { status: 400 });
      }

      console.log("Flow data inserted successfully:", insertedData?.length || 0, "records");
    } else {
      console.log("No flow data provided. flow_data:", flow_data, "is array:", Array.isArray(flow_data), "length:", flow_data?.length);
    }

    return NextResponse.json({
      ok: true,
      message: "Submitted for approval",
      head_id: head.id,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
  const headId = "05dd0ad0-5fe6-4a60-86c6-18eea5fc5409"; // AFR 205

  try {
    const body = await req.json();
    const { flow_data } = body;

    if (!flow_data || !Array.isArray(flow_data)) {
      return NextResponse.json(
        { ok: false, message: "flow_data array required" },
        { status: 400 }
      );
    }

    const flowDataRecords = flow_data.map((fd: any) => ({
      head_id: headId,
      lift: parseFloat(fd.lift),
      intake_flow: parseFloat(fd.intake_flow),
      exhaust_flow: parseFloat(fd.exhaust_flow),
    }));

    console.log("Inserting flow data:", flowDataRecords);

    const { data, error } = await supabase
      .from("cylinder_heads_flow_data")
      .insert(flowDataRecords)
      .select();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Inserted ${flowDataRecords.length} flow data points`,
      inserted: data,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

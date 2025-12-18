import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
  const headId = "05dd0ad0-5fe6-4a60-86c6-18eea5fc5409"; // AFR 205

  const flowData = [
    { lift: 0.05, intake_flow: 45, exhaust_flow: 38 },
    { lift: 0.10, intake_flow: 85, exhaust_flow: 68 },
    { lift: 0.15, intake_flow: 120, exhaust_flow: 95 },
    { lift: 0.20, intake_flow: 150, exhaust_flow: 118 },
    { lift: 0.25, intake_flow: 175, exhaust_flow: 138 },
    { lift: 0.30, intake_flow: 195, exhaust_flow: 155 },
    { lift: 0.35, intake_flow: 210, exhaust_flow: 168 },
    { lift: 0.40, intake_flow: 222, exhaust_flow: 178 },
    { lift: 0.45, intake_flow: 230, exhaust_flow: 185 },
    { lift: 0.50, intake_flow: 235, exhaust_flow: 190 },
    { lift: 0.55, intake_flow: 238, exhaust_flow: 193 },
    { lift: 0.60, intake_flow: 239, exhaust_flow: 194 },
    { lift: 0.65, intake_flow: 238, exhaust_flow: 192 },
    { lift: 0.70, intake_flow: 235, exhaust_flow: 188 },
    { lift: 0.75, intake_flow: 230, exhaust_flow: 182 },
  ];

  try {
    const { error } = await supabase.from("cylinder_heads_flow_data").insert(
      flowData.map((fd) => ({
        head_id: headId,
        lift: fd.lift,
        intake_flow: fd.intake_flow,
        exhaust_flow: fd.exhaust_flow,
      }))
    );

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Inserted ${flowData.length} flow data points for AFR 205`,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

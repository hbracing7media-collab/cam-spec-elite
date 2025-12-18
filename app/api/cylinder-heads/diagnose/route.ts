import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  try {
    // Get all heads with their flow data counts
    const { data: heads, error: headsError } = await supabase
      .from("cylinder_heads")
      .select("id, brand, part_name, status, created_at")
      .order("created_at", { ascending: false });

    if (headsError) throw headsError;

    // Get all flow data grouped by head
    const { data: flowData, error: flowError } = await supabase
      .from("cylinder_heads_flow_data")
      .select("head_id, lift, intake_flow, exhaust_flow");

    if (flowError) throw flowError;

    // Count flow data per head
    const flowCounts = (flowData || []).reduce((acc: any, fd: any) => {
      acc[fd.head_id] = (acc[fd.head_id] || 0) + 1;
      return acc;
    }, {});

    // Add flow counts to heads
    const headsWithCounts = (heads || []).map((h: any) => ({
      ...h,
      flow_data_count: flowCounts[h.id] || 0,
    }));

    return NextResponse.json({
      ok: true,
      heads: headsWithCounts,
      flow_data_by_head: Object.entries(flowCounts).map(([headId, count]) => ({
        head_id: headId,
        flow_point_count: count,
      })),
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}

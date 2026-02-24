import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    // Fetch all pending heads with flow data
    const { data, error } = await supabase
      .from("cylinder_heads")
      .select(`
        *,
        flow_curve:cylinder_heads_flow_data(lift, intake_flow, exhaust_flow)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    // Normalize flow data format for frontend
    const headsWithFlowData = (data || []).map((head: any) => {
      const flow_data = Array.isArray(head.flow_curve)
        ? head.flow_curve.map((point: any) => ({
            lift: point?.lift,
            intakeFlow: point?.intake_flow,
            exhaustFlow: point?.exhaust_flow,
          }))
        : [];
      const { flow_curve, ...rest } = head;
      return { ...rest, flow_data };
    });

    return NextResponse.json({
      ok: true,
      heads: headsWithFlowData,
    });
  } catch (error: unknown) {
    console.error("Error fetching pending heads:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

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

    // Fetch all pending heads
    const { data: heads, error: headsError } = await supabase
      .from("cylinder_heads")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (headsError) {
      return NextResponse.json(
        { ok: false, message: headsError.message },
        { status: 500 }
      );
    }

    // Fetch flow data for each head separately (bypasses RLS with service role)
    const headsWithFlowData = await Promise.all(
      (heads || []).map(async (head: any) => {
        const { data: flowData } = await supabase
          .from("cylinder_heads_flow_data")
          .select("lift, intake_flow, exhaust_flow")
          .eq("head_id", head.id)
          .order("lift", { ascending: true });

        const flow_data = (flowData || []).map((point: any) => ({
          lift: point.lift,
          intakeFlow: point.intake_flow,
          exhaustFlow: point.exhaust_flow,
        }));

        return { ...head, flow_data };
      })
    );

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

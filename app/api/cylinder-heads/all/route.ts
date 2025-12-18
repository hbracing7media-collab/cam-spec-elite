import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  // Get all heads with their flow data counts
  const { data: heads, error: headsError } = await supabase
    .from("cylinder_heads")
    .select("id, brand, part_name, status");

  if (headsError) {
    return NextResponse.json({ ok: false, message: headsError.message }, { status: 400 });
  }

  // For each head, count flow data
  const headsWithFlow = await Promise.all(
    heads.map(async (head: any) => {
      const { data: flowData, error: flowError } = await supabase
        .from("cylinder_heads_flow_data")
        .select("*", { count: "exact" })
        .eq("head_id", head.id);

      return {
        ...head,
        flow_data_count: flowError ? 0 : (flowData?.length || 0),
      };
    })
  );

  return NextResponse.json({
    ok: true,
    heads: headsWithFlow,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

  const headId = req.nextUrl.searchParams.get("headId");

  if (!headId) {
    return NextResponse.json({ ok: false, message: "Missing headId" }, { status: 400 });
  }

  try {
    const { data: flowData, error } = await supabase
      .from("cylinder_heads_flow_data")
      .select("*")
      .eq("head_id", headId)
      .order("lift", { ascending: true });

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      flow_data: flowData || [],
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ ok: false, message: "Error loading flow data" }, { status: 500 });
  }
}

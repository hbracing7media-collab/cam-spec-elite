import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const make = url.searchParams.get("make") || "";
    const family = url.searchParams.get("family") || "";

    if (!make || !family) {
      return NextResponse.json(
        { ok: false, message: "Missing make or family query parameters." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cylinder_heads")
      .select(`*, flow_curve:cylinder_heads_flow_data(lift,intake_flow,exhaust_flow)`)
      .eq("engine_make", make)
      .eq("engine_family", family)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: "Failed to fetch heads.", error: error?.message || String(error) },
        { status: 500 }
      );
    }

    const normalized = (data ?? []).map((head: any) => {
      const directFlow = Array.isArray(head.flow_data) ? head.flow_data : undefined;
      const relationalFlow = Array.isArray(head.flow_curve)
        ? head.flow_curve.map((point: any) => ({
            lift: point?.lift,
            intakeFlow: point?.intake_flow,
            exhaustFlow: point?.exhaust_flow,
          }))
        : undefined;

      const flow_data = directFlow ?? relationalFlow ?? [];
      const { flow_curve, ...rest } = head;
      return { ...rest, flow_data };
    });

    return NextResponse.json({ ok: true, heads: normalized }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: message },
      { status: 500 }
    );
  }
}

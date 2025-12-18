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

    const { headId } = await req.json();

    if (!headId) {
      return NextResponse.json(
        { ok: false, message: "Missing headId" },
        { status: 400 }
      );
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Delete the rejected head submission
    const { error } = await supabase
      .from("cylinder_heads")
      .delete()
      .eq("id", headId)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Head submission denied and removed",
    });
  } catch (error: unknown) {
    console.error("Denial error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Denial failed" },
      { status: 500 }
    );
  }
}

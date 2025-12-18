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

    const { submission_id } = await req.json();

    if (!submission_id) {
      return NextResponse.json(
        { ok: false, message: "Missing submission_id" },
        { status: 400 }
      );
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Update status to approved
    const { error } = await supabase
      .from("cylinder_heads")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Head approved successfully",
    });
  } catch (error: unknown) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Approval failed" },
      { status: 500 }
    );
  }
}

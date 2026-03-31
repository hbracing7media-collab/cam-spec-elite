import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

    // First, check if the head exists and get its current status
    const { data: existing, error: fetchError } = await supabase
      .from("cylinder_heads")
      .select("id, status, brand, part_number")
      .eq("id", submission_id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { ok: false, message: "Failed to find head: " + fetchError.message },
        { status: 404 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "Submission not found" },
        { status: 404 }
      );
    }

    // Update the submission status to approved
    const { data, error: updateError } = await supabase
      .from("cylinder_heads")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", submission_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, message: "Failed to approve: " + updateError.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, message: "Submission not found" },
        { status: 404 }
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

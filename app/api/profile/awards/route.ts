import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, message: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anonKey);

    // Get user_id from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "user_id parameter is required" },
        { status: 400 }
      );
    }

    // Fetch user's awards with award type details
    const { data: awards, error } = await supabase
      .from("user_awards")
      .select(
        `
        id,
        earned_at,
        submission_id,
        submission_type,
        award_types (
          id,
          slug,
          name,
          description,
          icon_emoji,
          badge_color
        )
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      awards: awards || [],
      total_count: awards?.length || 0,
    });
  } catch (err) {
    console.error("Awards fetch error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Failed to fetch awards" },
      { status: 500 }
    );
  }
}

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

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { user_id, award_type_id, submission_id, submission_type } = body;

    if (!user_id || !award_type_id) {
      return NextResponse.json(
        { ok: false, message: "user_id and award_type_id are required" },
        { status: 400 }
      );
    }

    // Check if award already exists
    const { data: existing } = await supabase
      .from("user_awards")
      .select("id")
      .eq("user_id", user_id)
      .eq("award_type_id", award_type_id)
      .eq("submission_id", submission_id || null)
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: true, message: "Award already exists", award: existing }
      );
    }

    // Insert award
    const { data: award, error } = await supabase
      .from("user_awards")
      .insert({
        user_id,
        award_type_id,
        submission_id: submission_id || null,
        submission_type: submission_type || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Award granted successfully",
      award,
    });
  } catch (err) {
    console.error("Award grant error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Failed to grant award" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json(
      { ok: false, message: "Server misconfigured - missing Supabase credentials" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  try {
    const url = new URL(req.url);
    const make = url.searchParams.get("make") || "";
    const family = url.searchParams.get("family") || "";

    console.log("[DYNO-CAMS-API] Fetching with make:", JSON.stringify(make), "family:", JSON.stringify(family));

    if (!make || !family) {
      console.log("[DYNO-CAMS-API] Missing parameters");
      return NextResponse.json(
        { ok: false, message: "Missing make or family query parameters.", make, family },
        { status: 400 }
      );
    }

    // Extract the base family name (before parentheses) for matching
    // e.g., "Small Block Windsor (221/260/289/302/351W)" -> "Small Block Windsor"
    const familyBase = family.split("(")[0].trim();

    console.log("[DYNO-CAMS-API] Base family for search:", JSON.stringify(familyBase));

    // Fetch from cse_cam_submissions_table - exact match first
    let { data: submissions, error: submissionError } = await supabaseAdmin
      .from("cse_cam_submissions_table")
      .select("id, cam_name, brand, part_number, engine_make, engine_family, status")
      .eq("engine_make", make)
      .eq("engine_family", family)
      .neq("status", "denied")
      .order("created_at", { ascending: false });

    console.log("[DYNO-CAMS-API] Exact match submissions found:", submissions?.length || 0);
    if (submissions && submissions.length > 0) {
      console.log("[DYNO-CAMS-API] Submissions data:", JSON.stringify(submissions.slice(0, 2)));
    }

    // If no exact match, try base family name match
    if ((!submissions || submissions.length === 0) && !submissionError) {
      console.log("[DYNO-CAMS-API] No exact match, trying base family match...");
      const { data: baseMatch, error: baseError } = await supabaseAdmin
        .from("cse_cam_submissions_table")
        .select("id, cam_name, brand, part_number, engine_make, engine_family, status")
        .eq("engine_make", make)
        .ilike("engine_family", familyBase + "%")
        .neq("status", "denied")
        .order("created_at", { ascending: false });

      console.log("[DYNO-CAMS-API] Base family match submissions found:", baseMatch?.length || 0);
      if (baseMatch && baseMatch.length > 0) {
        console.log("[DYNO-CAMS-API] Base match data:", JSON.stringify(baseMatch.slice(0, 2)));
      }
      submissions = baseMatch;
      submissionError = baseError;
    }

    // If still no match, try case-insensitive
    if ((!submissions || submissions.length === 0) && !submissionError) {
      console.log("[DYNO-CAMS-API] No base match, trying case-insensitive...");
      const { data: caseInsensitive, error: caseError } = await supabaseAdmin
        .from("cse_cam_submissions_table")
        .select("id, cam_name, brand, part_number, engine_make, engine_family, status")
        .ilike("engine_make", make)
        .ilike("engine_family", family)
        .neq("status", "denied")
        .order("created_at", { ascending: false });

      console.log("[DYNO-CAMS-API] Case-insensitive submissions found:", caseInsensitive?.length || 0);
      if (caseInsensitive && caseInsensitive.length > 0) {
        console.log("[DYNO-CAMS-API] Case-insensitive data:", JSON.stringify(caseInsensitive.slice(0, 2)));
      }
      submissions = caseInsensitive;
      submissionError = caseError;
    }

    // Debug: Show what's in the database for this make if we still found nothing
    if ((!submissions || submissions.length === 0) && !submissionError) {
      console.log("[DYNO-CAMS-API] Still no matches, checking what's in DB for make:", make);
      const { data: debugData } = await supabaseAdmin
        .from("cse_cam_submissions_table")
        .select("engine_make, engine_family")
        .eq("engine_make", make)
        .limit(5);
      console.log("[DYNO-CAMS-API] Sample records for make:", JSON.stringify(debugData || []));
    }

    if (submissionError) {
      throw submissionError;
    }

    // Format results from submissions only
    const cams = (submissions || []).map((cam: any) => ({
      id: cam.id,
      name: `${cam.brand} ${cam.cam_name}${cam.part_number ? ` (${cam.part_number})` : ""}`,
    }));

    console.log("[DYNO-CAMS-API] Returning", cams.length, "total cams from submissions");

    return NextResponse.json({ ok: true, cams, debug: { make, family, familyBase, submissionsCount: submissions?.length || 0, totalCount: cams.length } }, { status: 200 });
  } catch (error) {
    console.error("[DYNO-CAMS-API] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch cams.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

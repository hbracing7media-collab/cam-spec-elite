import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    console.log("[DYNO-HEADS-API] Fetching with make:", JSON.stringify(make), "family:", JSON.stringify(family));

    if (!make || !family) {
      console.log("[DYNO-HEADS-API] Missing parameters");
      return NextResponse.json(
        { ok: false, message: "Missing make or family query parameters.", make, family },
        { status: 400 }
      );
    }

    // Extract the base family name (before parentheses) for matching
    // e.g., "Small Block Windsor (221/260/289/302/351W)" -> "Small Block Windsor"
    const familyBase = family.split("(")[0].trim();

    console.log("[DYNO-HEADS-API] Base family for search:", JSON.stringify(familyBase));

    // Try exact match first
    let { data, error } = await supabaseAdmin
      .from("cylinder_heads")
      .select("id, part_name, brand, part_number, engine_make, engine_family, status")
      .eq("engine_make", make)
      .eq("engine_family", family)
      .order("created_at", { ascending: false });

    console.log("[DYNO-HEADS-API] Exact match found:", data?.length || 0);

    // If no exact match, try base family name match
    if ((!data || data.length === 0) && !error) {
      console.log("[DYNO-HEADS-API] No exact match, trying base family match...");
      const { data: baseMatch, error: baseError } = await supabaseAdmin
        .from("cylinder_heads")
        .select("id, part_name, brand, part_number, engine_make, engine_family, status")
        .eq("engine_make", make)
        .ilike("engine_family", familyBase + "%")
        .order("created_at", { ascending: false });

      console.log("[DYNO-HEADS-API] Base family match found:", baseMatch?.length || 0);
      data = baseMatch;
      error = baseError;
    }

    // If still no match, try case-insensitive exact
    if ((!data || data.length === 0) && !error) {
      console.log("[DYNO-HEADS-API] No base match, trying case-insensitive...");
      const { data: caseInsensitive, error: caseError } = await supabaseAdmin
        .from("cylinder_heads")
        .select("id, part_name, brand, part_number, engine_make, engine_family, status")
        .ilike("engine_make", make)
        .ilike("engine_family", family)
        .order("created_at", { ascending: false });

      console.log("[DYNO-HEADS-API] Case-insensitive found:", caseInsensitive?.length || 0);
      data = caseInsensitive;
      error = caseError;
    }

    if (error) {
      throw error;
    }

    // Format results
    const heads = (data || []).map((head: any) => ({
      id: head.id,
      name: `${head.brand} ${head.part_name}${head.part_number ? ` (${head.part_number})` : ""}`,
    }));

    console.log("[DYNO-HEADS-API] Returning", heads.length, "heads");

    return NextResponse.json({ ok: true, heads, debug: { make, family, familyBase, foundCount: heads.length } }, { status: 200 });
  } catch (error) {
    console.error("[DYNO-HEADS-API] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch heads.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

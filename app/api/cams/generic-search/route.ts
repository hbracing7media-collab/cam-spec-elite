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

const FAMILY_STOPWORDS = new Set([
  "engine",
  "family",
  "series",
  "block",
  "blocks",
  "small",
  "big",
  "gen",
  "iii",
  "iv",
  "v",
  "vi",
  "ls",
  "lt",
  "ohv",
  "ohc",
  "sohc",
  "dohc",
]);

function stripParenthetical(input: string) {
  return input.replace(/\(.*?\)/g, " ").trim();
}

function sanitizeToken(token: string) {
  return token.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function tokenizeFamily(input: string) {
  return stripParenthetical(input)
    .toLowerCase()
    .split(/[\s/,-]+/)
    .map((token) => sanitizeToken(token))
    .filter((token) => token.length >= 3 && !/^[0-9]+$/.test(token) && !FAMILY_STOPWORDS.has(token));
}

function sanitizePatternToken(token: string) {
  return token.replace(/[%_]/g, "").trim();
}

type FilterSpec = { type: "eq" | "ilike"; value: string };

function buildFamilyFilters(family: string, providedTokens: string[]): FilterSpec[] {
  const filters: FilterSpec[] = [{ type: "eq", value: family }];
  const trimmed = stripParenthetical(family);
  const normalizedProvided = providedTokens
    .map(sanitizePatternToken)
    .filter(Boolean);
  const derivedTokens = tokenizeFamily(family);
  const combinedTokens = Array.from(new Set([...normalizedProvided, ...derivedTokens]));

  if (trimmed && trimmed !== family) {
    const safe = sanitizePatternToken(trimmed);
    if (safe) filters.push({ type: "ilike", value: `%${safe}%` });
  }

  combinedTokens.forEach((token) => {
    const safe = sanitizePatternToken(token);
    if (safe) filters.push({ type: "ilike", value: `%${safe}%` });
  });

  return filters;
}

function baseQuery(make: string) {
  return supabaseAdmin
    .from("cse_generic_cams")
    .select("*")
    .eq("make", make)
    .order("updated_at", { ascending: false });
}

// Transform generic cam row to match submission cam format for client compatibility
function transformGenericCam(row: any) {
  return {
    id: row.id,
    cam_name: row.cam_name,
    brand: row.brand,
    part_number: row.pn,
    engine_make: row.make,
    engine_family: row.family,
    duration_int_050: row.dur_int_050,
    duration_exh_050: row.dur_exh_050,
    lift_int: row.lift_int,
    lift_exh: row.lift_exh,
    lsa: row.lsa,
    notes: row.notes,
    status: "approved", // generic cams are always approved
    source_url: row.source_url,
  };
}

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

    // Try exact match first
    let response = await supabaseAdmin
      .from("cse_generic_cams")
      .select("*")
      .eq("make", make)
      .eq("family", family)
      .order("updated_at", { ascending: false });

    if (response.error) {
      console.error("Exact match error:", response.error);
      return NextResponse.json(
        { ok: false, message: "Failed to fetch cams.", error: response.error.message },
        { status: 500 }
      );
    }

    let cams = (response.data || []).map(transformGenericCam);

    // If no exact match, try partial match on family
    if (cams.length === 0) {
      const familyPattern = `%${stripParenthetical(family)}%`;
      response = await supabaseAdmin
        .from("cse_generic_cams")
        .select("*")
        .eq("make", make)
        .ilike("family", familyPattern)
        .order("updated_at", { ascending: false });

      if (response.error) {
        console.error("Partial match error:", response.error);
        return NextResponse.json(
          { ok: false, message: "Failed to fetch cams.", error: response.error.message },
          { status: 500 }
        );
      }

      cams = (response.data || []).map(transformGenericCam);
    }

    console.log(`Search for make="${make}" family="${family}" returned ${cams.length} cams`);
    return NextResponse.json({ ok: true, cams }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Generic cam search error:", message);
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: message },
      { status: 500 }
    );
  }
}

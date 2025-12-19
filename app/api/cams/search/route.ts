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
    .from("cse_cam_submissions_table")
    .select("*")
    .eq("engine_make", make)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const make = url.searchParams.get("make") || "";
    const family = url.searchParams.get("family") || "";
    const providedTokens = url.searchParams.getAll("familyToken").map((token) => sanitizePatternToken(token));

    if (!make || !family) {
      return NextResponse.json(
        { ok: false, message: "Missing make or family query parameters." },
        { status: 400 }
      );
    }

    const filters = buildFamilyFilters(family, providedTokens);
    let cams: any[] = [];

    for (const filter of filters) {
      const query = baseQuery(make);
      const response =
        filter.type === "eq"
          ? await query.eq("engine_family", filter.value)
          : await query.ilike("engine_family", filter.value);

      if (response.error) {
        return NextResponse.json(
          { ok: false, message: "Failed to fetch cams.", error: response.error.message },
          { status: 500 }
        );
      }

      cams = response.data || [];
      if (cams.length > 0) break;
    }

    return NextResponse.json({ ok: true, cams }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, message: "Unhandled error.", error: message },
      { status: 500 }
    );
  }
}
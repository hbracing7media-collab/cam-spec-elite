import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BoostSuitability, CamRecommendation } from "@/lib/cams/types";
import { GLOBAL_CAM_CATALOG } from "@/lib/cams/globalCatalog";
import { familyTokensForSearch } from "@/lib/cams/utils";

const SUGGESTION_CAP = 5;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

type GenericCamRow = {
  id: string;
  make: string;
  family: string;
  brand: string;
  pn: string;
  cam_name?: string | null;
  dur_int_050?: number | string | null;
  dur_exh_050?: number | string | null;
  lsa?: number | string | null;
  lift_int?: number | string | null;
  lift_exh?: number | string | null;
  peak_hp_rpm?: number | string | null;
  boost_ok?: string | null;
  notes?: string | null;
  source_url?: string | null;
  family_tags?: string[] | null;
};

const sanitizeText = (value?: string | null) => (value || "").trim();

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function guessPeakHpRpm(durInt: number, durExh: number) {
  const avg = (durInt + durExh) / 2;
  const rpm = 3000 + (avg - 200) * 35;
  return Math.max(2500, Math.min(9000, Math.round(rpm)));
}

function guessLsa(durInt: number, durExh: number) {
  const avg = (durInt + durExh) / 2;
  let lsa = 112;
  if (avg >= 250) lsa = 110;
  else if (avg >= 235) lsa = 111;
  else if (avg <= 205) lsa = 115;
  else if (avg <= 215) lsa = 114;

  const split = Math.abs(durExh - durInt);
  if (split >= 12) lsa += 0.5;
  if (split <= 6) lsa -= 0.5;

  return Number(Math.max(106, Math.min(118, lsa)).toFixed(1));
}

function guessLift(durInt: number, durExh: number) {
  const avg = (durInt + durExh) / 2;
  let lift = 0.44 + (avg - 200) * 0.002;
  lift = Math.max(0.38, Math.min(0.75, lift));
  return Number(lift.toFixed(3));
}

function normalizeBoost(value?: string | null): BoostSuitability {
  const normalized = sanitizeText(value).toLowerCase();
  if (normalized === "yes") return "yes";
  if (normalized === "no") return "no";
  return "either";
}

function buildTokenSet(family: string, providedTokens: string[]) {
  const derived = familyTokensForSearch(family);
  const normalized = [...derived, ...providedTokens]
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  return new Set(normalized);
}

function tokensFromRow(row: Pick<GenericCamRow, "family" | "family_tags">) {
  const tokens = new Set<string>();
  const family = sanitizeText(row.family).toLowerCase();
  if (family) tokens.add(family);
  const tags = Array.isArray(row.family_tags) ? row.family_tags : [];
  tags.forEach((tag) => {
    const t = sanitizeText(tag).toLowerCase();
    if (t) tokens.add(t);
  });
  familyTokensForSearch(row.family || "").forEach((token) => tokens.add(token));
  return tokens;
}

function rowMatchesFamily(row: GenericCamRow, requestedFamily: string, tokenSet: Set<string>) {
  const requested = sanitizeText(requestedFamily).toLowerCase();
  const rowTokens = tokensFromRow(row);
  if (requested && rowTokens.has(requested)) return true;
  if (!tokenSet.size) return requested ? rowTokens.has(requested) : true;
  for (const token of tokenSet) {
    if (rowTokens.has(token)) return true;
  }
  return false;
}

function rowToCam(row: GenericCamRow): CamRecommendation | null {
  const durInt = coerceNumber(row.dur_int_050);
  const durExh = coerceNumber(row.dur_exh_050);
  if (durInt === null || durExh === null) return null;

  let lsa = coerceNumber(row.lsa);
  if (lsa === null) lsa = guessLsa(durInt, durExh);

  let liftInt = coerceNumber(row.lift_int);
  let liftExh = coerceNumber(row.lift_exh);
  if (liftInt === null || liftExh === null) {
    const guessed = guessLift(durInt, durExh);
    if (liftInt === null) liftInt = guessed;
    if (liftExh === null) liftExh = Number((guessed + 0.008).toFixed(3));
  }

  if (lsa === null || liftInt === null || liftExh === null) return null;

  const peakHpRpm = coerceNumber(row.peak_hp_rpm) ?? guessPeakHpRpm(durInt, durExh);
  return {
    id: row.id,
    make: row.make,
    family: row.family,
    brand: row.brand,
    pn: row.pn,
    name: sanitizeText(row.cam_name) || undefined,
    durInt,
    durExh,
    lsa,
    liftInt,
    liftExh,
    peakHpRpm,
    boostOK: normalizeBoost(row.boost_ok),
    notes: sanitizeText(row.notes) || undefined,
    sourceUrl: sanitizeText(row.source_url) || undefined,
  };
}

function dedupeAndLimit(rows: GenericCamRow[], tokenSet: Set<string>, requestedFamily: string) {
  const prioritized = rows.filter((row) => rowMatchesFamily(row, requestedFamily, tokenSet));
  const remainder = rows.filter((row) => !rowMatchesFamily(row, requestedFamily, tokenSet));
  const ordered = [...prioritized, ...remainder];
  const cams: CamRecommendation[] = [];
  const seen = new Set<string>();

  for (const row of ordered) {
    if (cams.length >= SUGGESTION_CAP) break;
    const cam = rowToCam(row);
    if (!cam) continue;
    const key = `${cam.brand.toLowerCase()}|${cam.pn.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cams.push(cam);
  }

  return cams;
}

function catalogMatchesFamily(cam: (typeof GLOBAL_CAM_CATALOG)[number], requestedFamily: string, tokenSet: Set<string>) {
  const tokens = new Set<string>();
  tokens.add(cam.family.trim().toLowerCase());
  cam.familyTags.forEach((tag) => tokens.add(tag.trim().toLowerCase()));
  familyTokensForSearch(cam.family).forEach((token) => tokens.add(token));
  const requested = requestedFamily.trim().toLowerCase();
  if (tokens.has(requested)) return true;
  if (!tokenSet.size) return true;
  for (const token of tokenSet) {
    if (tokens.has(token)) return true;
  }
  return false;
}

function fallbackFromCatalog(make: string, family: string, tokenSet: Set<string>) {
  const sameMake = GLOBAL_CAM_CATALOG.filter((cam) => cam.make === make);
  if (!sameMake.length) return [];

  const familyMatches = sameMake.filter((cam) => catalogMatchesFamily(cam, family, tokenSet));
  const orderedPool = [...familyMatches];
  sameMake.forEach((cam) => {
    if (!orderedPool.includes(cam)) {
      orderedPool.push(cam);
    }
  });

  return orderedPool.slice(0, SUGGESTION_CAP);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const make = (url.searchParams.get("make") || "").trim();
  const family = (url.searchParams.get("family") || "").trim();
  const providedTokens = url
    .searchParams
    .getAll("familyToken")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (!make || !family) {
    return NextResponse.json(
      { ok: false, message: "Missing make or family query parameters." },
      { status: 400 }
    );
  }

  const tokenSet = buildTokenSet(family, providedTokens);

  try {
    const { data, error } = await supabaseAdmin
      .from("cse_generic_cams")
      .select("*")
      .eq("make", make)
      .order("updated_at", { ascending: false })
      .limit(400);

    if (error) {
      throw error;
    }

    const rows = Array.isArray(data) ? data : [];
    const cams = dedupeAndLimit(rows, tokenSet, family);
    if (cams.length > 0) {
      return NextResponse.json({ ok: true, cams }, { status: 200 });
    }
  } catch (err) {
    console.error("Global cam search failed", err);
  }

  const fallback = fallbackFromCatalog(make, family, tokenSet);
  return NextResponse.json({ ok: true, cams: fallback }, { status: 200 });
}

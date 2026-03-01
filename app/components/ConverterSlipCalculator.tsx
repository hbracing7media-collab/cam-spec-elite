'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import type { BoostSuitability, CamRecommendation } from "@/lib/cams/types";
import { familiesOverlap, familyTokensForSearch } from "@/lib/cams/utils";

type Units = "std" | "met";
type Induction = "na" | "boost";
type Usage = "street" | "strip" | "truck";
type IdlePref = "smooth" | "chop" | "dontcare";
type BoostOK = BoostSuitability;
type Cam = CamRecommendation;

type ConverterSlipCalculatorMode = "selective" | "global";

export type ConverterSlipCalculatorProps = {
  mode?: ConverterSlipCalculatorMode;
  desiredSuggestions?: number;
};

const CID_PER_LITER = 61.0237441;
const KW_PER_HP = 0.745699872;
const HP_PER_KW = 1 / KW_PER_HP;

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
function fmt3(n: number) {
  return Number.isFinite(n) ? n.toFixed(3) : "";
}
function normStr(s: string) {
  return (s || "").trim();
}

// Makes/Families
const ENGINE_FAMILIES: Record<string, string[]> = {
  Ford: [
    "SBF Windsor (221/260/289/302/351W)",
    "SBF Cleveland/Modified (351C/351M/400)",
    "FE Big Block (332/352/360/390/406/427/428)",
    "385-Series Big Block (429/460)",
    "Modular 2V/3V (4.6/5.4)",
    "Coyote / Modular DOHC (5.0 Coyote)",
    "Godzilla (7.3)",
    "EcoBoost I4/I6 (2.3/2.7/3.0/3.5)",
  ],
  "Chevy / GM": [
    "SBC Gen I (265-400)",
    "Gen III/IV LS (4.8/5.3/5.7/6.0/6.2/7.0)",
    "Gen V LT (LT1/LT2/LT4/LT5)",
    "BBC (Mark IV / Gen V / Gen VI 396-502+)",
    "Ecotec (1.4/1.5/2.0/2.4)",
  ],
  Mopar: ["LA Small Block (273/318/340/360)", "Gen III Hemi (5.7/6.1/6.2/6.4)", "B/RB Big Block (361/383/400/413/426W/440)"],
  "Toyota / Lexus": ["JZ (1JZ/2JZ)", "UZ (1UZ/3UZ)", "GR (2GR/3GR/4GR)"],
  "Nissan / Infiniti": ["RB (RB20/25/26)", "SR (SR20)", "VQ (VQ35/VQ37)", "VR (VR30/VR38)"],
  "Honda / Acura": ["K-Series (K20/K24)", "B-Series (B16/B18)"],
  Subaru: ["EJ (EJ20/EJ25)", "FA/FB (FA20/FA24/FB20/FB25)"],
  "VW / Audi": ["EA888 (1.8T/2.0T Gen 1-4)", "VR6 (2.8/3.2/3.6)"],
  BMW: ["N54/N55", "B58", "S58"],
};

type DbCamRow = {
  id?: string;
  cam_name?: string | null;
  brand?: string | null;
  part_number?: string | null;
  engine_make?: string | null;
  engine_family?: string | null;
  duration_int_050?: number | string | null;
  duration_exh_050?: number | string | null;
  lift_int?: number | string | null;
  lift_exh?: number | string | null;
  lsa?: number | string | null;
  rpm_end?: number | string | null;
  notes?: string | null;
  spec?: Record<string, any> | null;
};

type ValidatedInputs = {
  make: string;
  family: string;
  cid: number;
  targetHp: number;
  peakRpm: number;
  induction: Induction;
  usage: Usage;
  idle: IdlePref;
};

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

function pickNumber(values: unknown[], fallback?: number): number | null {
  for (const v of values) {
    const num = coerceNumber(v);
    if (num !== null) return num;
  }
  return typeof fallback === "number" ? fallback : null;
}

function isCamRecommendation(row: any): row is Cam {
  if (!row) return false;
  return (
    typeof row.make === "string" &&
    typeof row.family === "string" &&
    typeof row.brand === "string" &&
    typeof row.pn === "string" &&
    typeof row.durInt === "number" &&
    typeof row.durExh === "number" &&
    typeof row.lsa === "number" &&
    typeof row.liftInt === "number" &&
    typeof row.liftExh === "number" &&
    typeof row.peakHpRpm === "number" &&
    typeof row.boostOK === "string"
  );
}

function guessPeakRpm(durInt: number, durExh: number): number {
  const avg = (durInt + durExh) / 2;
  const rpm = 3000 + (avg - 200) * 35;
  return clamp(Math.round(rpm), 2500, 9000);
}

function estimateOverlap(durInt: number, durExh: number, lsa: number) {
  return durInt + durExh - 2 * lsa;
}

function deriveBoostStatus(lsa: number | null, ...textInputs: Array<string | null | undefined>): BoostOK {
  const haystack = textInputs
    .map((t) => (t ? String(t).toLowerCase() : ""))
    .join(" ");
  if (haystack.includes("boost") || haystack.includes("turbo") || haystack.includes("blower")) return "yes";
  if (haystack.includes("na only") || haystack.includes("naturally aspirated")) return "no";
  if (typeof lsa === "number") {
    if (lsa >= 113.5) return "yes";
    if (lsa <= 110) return "no";
  }
  return "either";
}

function mapDbRowToCam(row: DbCamRow): Cam | null {
  const spec = row.spec || {};
  const durInt = pickNumber([row.duration_int_050, spec.dur_int_050, spec.duration_int_050, spec.durInt050]);
  const durExh = pickNumber([row.duration_exh_050, spec.dur_exh_050, spec.duration_exh_050, spec.durExh050]);
  const lsa = pickNumber([row.lsa, spec.lsa]);
  const liftInt = pickNumber([row.lift_int, spec.lift_int]);
  const liftExh = pickNumber([row.lift_exh, spec.lift_exh]);
  if (durInt === null || durExh === null || lsa === null || liftInt === null || liftExh === null) return null;

  const peakHpRpm =
    pickNumber([row.rpm_end, spec.rpm_end, spec.rpmEnd], undefined) ?? guessPeakRpm(durInt, durExh);
  const make = row.engine_make || spec.engine_make;
  const family = row.engine_family || spec.engine_family;
  if (!make || !family) return null;

  const boostOK = deriveBoostStatus(lsa, spec.induction, spec.inductionPreference, row.notes, spec.notes, row.cam_name);

  return {
    id: row.id || `${row.brand || "cam"}-${row.part_number || "pn"}`,
    make,
    family,
    brand: row.brand || spec.brand || "Unknown",
    pn: row.part_number || spec.part_number || "NO-PN",
    name: row.cam_name || spec.cam_name || undefined,
    durInt,
    durExh,
    lsa,
    liftInt,
    liftExh,
    peakHpRpm,
    boostOK,
    notes: row.notes || spec.notes || undefined,
  };
}

function computePerfectSpec(inp: {
  cid: number;
  targetHp: number;
  peakRpm: number;
  induction: Induction;
  usage: Usage;
  idle: IdlePref;
}) {
  const hpPerCid = inp.targetHp / inp.cid;
  const rpm = inp.peakRpm;

  // LSA target
  let lsa = 112;
  if (inp.induction === "boost") lsa = 114;
  if (inp.usage === "truck") lsa = inp.induction === "boost" ? 114 : 112;
  if (inp.usage === "strip" && inp.induction === "na") lsa = 110;
  if (inp.idle === "chop") lsa -= 1.5;
  if (inp.idle === "smooth") lsa += 1.5;

  // Duration target (avg @.050)
  let durAvg = 218 + (hpPerCid - 1.2) * 70;
  durAvg += ((rpm - 6000) / 500) * 4;
  if (inp.induction === "boost") durAvg -= 6;
  if (inp.usage === "truck") durAvg -= 10;
  if (inp.usage === "strip") durAvg += 6;
  if (inp.idle === "chop") durAvg += 4;
  if (inp.idle === "smooth") durAvg -= 4;
  durAvg = clamp(durAvg, 200, 252);

  // Split I/E
  let split = 8;
  if (inp.induction === "boost") split = 6;
  if (inp.usage === "truck") split = 6;
  if (inp.usage === "strip" && inp.induction === "na") split = 10;
  if (inp.idle === "chop") split += 2;
  if (inp.idle === "smooth") split -= 2;
  split = clamp(split, 4, 12);

  lsa = clamp(lsa, 104, 118);

  const durInt = Math.round(durAvg - split / 2);
  const durExh = Math.round(durAvg + split / 2);

  // Lift target (simple guidance)
  let liftBase = 0.5 + (inp.cid - 300) / 4000;
  if (inp.usage === "strip") liftBase += 0.02;
  if (inp.usage === "truck") liftBase -= 0.015;
  if (inp.induction === "boost") liftBase += 0.005;
  liftBase = clamp(liftBase, 0.42, 0.7);

  const liftInt = Math.round(liftBase * 1000) / 1000;
  const liftExh = Math.round((liftBase + (inp.induction === "boost" ? 0.005 : 0.01)) * 1000) / 1000;

  const bandLo = Math.max(2500, Math.round(rpm - 1000));
  const bandHi = Math.round(rpm + 600);

  return { durInt, durExh, lsa, liftInt, liftExh, bandLo, bandHi, hpPerCid: Math.round(hpPerCid * 100) / 100 };
}

function camDistanceScore(
  cam: Cam,
  target: ReturnType<typeof computePerfectSpec>,
  inp: { peakRpm: number; induction: Induction; idle: IdlePref }
) {
  const durAvgCam = (cam.durInt + cam.durExh) / 2;
  const durAvgTar = (target.durInt + target.durExh) / 2;

  const dDur = Math.abs(durAvgCam - durAvgTar);
  const dSplit = Math.abs((cam.durExh - cam.durInt) - (target.durExh - target.durInt));
  const dLsa = Math.abs((cam.lsa || 112) - target.lsa);
  const dLift =
    Math.abs((cam.liftInt || target.liftInt) - target.liftInt) * 1000 +
    Math.abs((cam.liftExh || target.liftExh) - target.liftExh) * 1000;
  const dRpm = Math.abs((cam.peakHpRpm || inp.peakRpm) - inp.peakRpm) / 100;
  const overlapTarget = estimateOverlap(target.durInt, target.durExh, target.lsa);
  const overlapCam = estimateOverlap(cam.durInt, cam.durExh, cam.lsa);

  let indPenalty = 0;
  if (inp.induction === "boost" && cam.boostOK === "no") indPenalty += 50;
  if (inp.induction === "na" && cam.boostOK === "yes") indPenalty += 4;

  let idlePenalty = 0;
  if (inp.idle === "chop") {
    if (cam.lsa > target.lsa + 0.5) idlePenalty += (cam.lsa - target.lsa) * 3.2;
    if (overlapCam + 1 < overlapTarget) idlePenalty += (overlapTarget - overlapCam) * 0.35;
  } else if (inp.idle === "smooth") {
    if (cam.lsa + 0.5 < target.lsa) idlePenalty += (target.lsa - cam.lsa) * 2.4;
    if (overlapCam > overlapTarget + 1) idlePenalty += (overlapCam - overlapTarget) * 0.3;
  }

  return dDur * 1.8 + dSplit * 0.6 + dLsa * 3 + dLift * 0.06 + dRpm * 1.2 + indPenalty + idlePenalty;
}

export default function ConverterSlipCalculator({ mode = "selective", desiredSuggestions }: ConverterSlipCalculatorProps) {
  const t = useTranslations('camSuggestor');
  const isGlobalMode = mode === "global";
  const usesGlobalCatalog = isGlobalMode;
  const suggestionCap = isGlobalMode ? Math.max(desiredSuggestions ?? 3, 3) : desiredSuggestions ?? 4;
  const suggestionHeadline = isGlobalMode ? "Web-Referenced" : "Approved";
  const sourceLabel = isGlobalMode ? "web-referenced cams" : "approved cams";
  const feedLabel = isGlobalMode ? "web catalog" : "approved cam library";
  const widgetSubtitle = isGlobalMode
    ? `Generates perfect target specs, then pulls the closest ${suggestionCap} web-referenced cams (brand + part number).`
    : `Generates perfect target specs, then recommends the top ${suggestionCap} approved cams.`;
  const resultsTitle = isGlobalMode
    ? `Perfect Spec + Top ${suggestionCap} ${suggestionHeadline} Cams.`
    : `Perfect Spec + Top ${suggestionCap} ${suggestionHeadline} Cams`;
  const initialResultsNote = isGlobalMode
    ? `Enter your combo to pull ${suggestionCap} web-referenced cams.`
    : "Enter your combo and hit Suggest.";

  const makes = useMemo(() => Object.keys(ENGINE_FAMILIES).sort(), []);

  // top controls
  const [units, setUnits] = useState<Units>("std");
  const [induction, setInduction] = useState<Induction>("na");
  const [usage, setUsage] = useState<Usage>("street");
  const [idle, setIdle] = useState<IdlePref>("chop");

  const [make, setMake] = useState<string>(makes[0] || "Ford");
  const families = useMemo(() => (ENGINE_FAMILIES[make] || []).slice().sort(), [make]);
  const [family, setFamily] = useState<string>(families[0] || "");

  // inputs
  const [cid, setCid] = useState<string>("");
  const [liters, setLiters] = useState<string>("");
  const [targetHp, setTargetHp] = useState<string>("");
  const [targetKw, setTargetKw] = useState<string>("");
  const [peakRpm, setPeakRpm] = useState<string>("");
  const [comboNotes, setComboNotes] = useState<string>("");

  // results
  const [status, setStatus] = useState<string>("");
  const [resultsNote, setResultsNote] = useState<string>(initialResultsNote);
  const [target, setTarget] = useState<ReturnType<typeof computePerfectSpec> | null>(null);
  const [topCams, setTopCams] = useState<{ cam: Cam; dist: number; match: number }[]>([]);
  const [library, setLibrary] = useState<Cam[]>([]);
  const [libraryStatus, setLibraryStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [libraryError, setLibraryError] = useState<string>("");
  const [lastCalc, setLastCalc] = useState<{ inputs: ValidatedInputs; target: ReturnType<typeof computePerfectSpec> } | null>(null);
  const [awaitingLibrary, setAwaitingLibrary] = useState(false);

  useEffect(() => {
    setResultsNote(initialResultsNote);
  }, [initialResultsNote]);

  const scoreWithLibrary = useCallback(
    (calc: { inputs: ValidatedInputs; target: ReturnType<typeof computePerfectSpec> } | null) => {
      if (!calc || libraryStatus !== "ready") return;

      const { inputs: inp, target: t } = calc;

      const cams = library.filter((c) => {
        if (c.make !== inp.make) return false;
        if (!familiesOverlap(inp.family, c.family)) return false;
        if (inp.induction === "boost" && c.boostOK === "no") return false;
        return true;
      });

      if (cams.length === 0) {
        setStatus(isGlobalMode ? "No web-referenced cams yet for this combo." : "No approved cams yet for this combo.");
        setTopCams([]);
        setResultsNote(`We don't have ${sourceLabel} for ${inp.make} / ${inp.family} yet.`);
        return;
      }

      const scored = cams
        .map((cam) => {
          const dist = camDistanceScore(cam, t, inp);
          const match = clamp(Math.round(100 - dist * 1.25), 0, 100);
          return { cam, dist, match };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, suggestionCap);

      setTopCams(scored);
      setResultsNote(
        `Perfect target generated - showing top ${Math.min(scored.length, suggestionCap)} ${sourceLabel} for ${inp.make} / ${inp.family}.`
      );
      setStatus(`Showing ${scored.length} best matched cams.`);
    },
    [library, libraryStatus, suggestionCap, sourceLabel, isGlobalMode]
  );

  // keep family valid when make changes
  useEffect(() => {
    const fams = (ENGINE_FAMILIES[make] || []).slice().sort();
    setFamily((prev) => (fams.includes(prev) ? prev : fams[0] || ""));
  }, [make]);

  useEffect(() => {
    if (!make || !family) {
      setLibrary([]);
      setLibraryStatus("idle");
      setLibraryError("");
      return;
    }

    let canceled = false;
    const controller = new AbortController();
    async function loadLibrary() {
      setLibraryStatus("loading");
      setLibraryError("");
      try {
        const params = new URLSearchParams({ make, family });
        familyTokensForSearch(family)
          .slice(0, 4)
          .forEach((token) => params.append("familyToken", token));
        const endpoint = usesGlobalCatalog ? "/api/cams/global-search" : "/api/cams/search";
        const res = await fetch(`${endpoint}?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => ({}));
        if (canceled) return;
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.message || `Failed to load cams (${res.status})`);
        }
        const rows = Array.isArray(payload.cams) ? payload.cams : [];
        const normalized = usesGlobalCatalog
          ? rows.filter((row: any): row is Cam => isCamRecommendation(row))
          : rows
              .map((row: DbCamRow) => mapDbRowToCam(row))
              .filter((cam): cam is Cam => Boolean(cam));

        setLibrary(normalized);
        setLibraryStatus("ready");
      } catch (err) {
        if (canceled) return;
        setLibrary([]);
        setLibraryStatus("error");
        setLibraryError(err instanceof Error ? err.message : "Unable to load cam library.");
      }
    }

    loadLibrary();

    return () => {
      canceled = true;
      controller.abort();
    };
  }, [make, family, usesGlobalCatalog]);

  useEffect(() => {
    if (!awaitingLibrary) return;
    if (libraryStatus === "ready") {
      scoreWithLibrary(lastCalc);
      setAwaitingLibrary(false);
    } else if (libraryStatus === "error") {
      setAwaitingLibrary(false);
    }
  }, [awaitingLibrary, libraryStatus, lastCalc, scoreWithLibrary]);

  useEffect(() => {
    if (!lastCalc) return;
    if (libraryStatus !== "ready") return;
    scoreWithLibrary(lastCalc);
  }, [lastCalc, libraryStatus, scoreWithLibrary]);

  // units conversion (best-effort)
  useEffect(() => {
    if (units === "std") {
      const L = Number(liters);
      if (L > 0 && !(Number(cid) > 0)) setCid((L * CID_PER_LITER).toFixed(0));

      const kW = Number(targetKw);
      if (kW > 0 && !(Number(targetHp) > 0)) setTargetHp(String(Math.round(kW * HP_PER_KW)));
    } else {
      const c = Number(cid);
      if (c > 0 && !(Number(liters) > 0)) setLiters((c / CID_PER_LITER).toFixed(2));

      const hp = Number(targetHp);
      if (hp > 0 && !(Number(targetKw) > 0)) setTargetKw(String(Math.round(hp * KW_PER_HP)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  function resetAll() {
    setCid("");
    setLiters("");
    setTargetHp("");
    setTargetKw("");
    setPeakRpm("");
    setComboNotes("");

    setInduction("na");
    setUsage("street");
    setIdle("chop");

    setStatus("");
    setResultsNote(initialResultsNote);
    setTarget(null);
    setTopCams([]);
  }

  function validateInputs(): { ok: boolean; problems: string[]; data: ValidatedInputs } {
    const m = normStr(make);
    const f = normStr(family);
    const pr = Number(peakRpm);

    let cidNorm = 0;
    let hpNorm = 0;

    if (units === "std") {
      cidNorm = Number(cid);
      hpNorm = Number(targetHp);
    } else {
      const L = Number(liters);
      const kW = Number(targetKw);
      cidNorm = L > 0 ? L * CID_PER_LITER : 0;
      hpNorm = kW > 0 ? kW * HP_PER_KW : 0;
    }

    const probs: string[] = [];
    if (!m) probs.push("Choose make.");
    if (!f) probs.push("Choose family.");
    if (!(cidNorm > 0)) probs.push(units === "std" ? "Enter CID." : "Enter liters.");
    if (!(hpNorm > 0)) probs.push(units === "std" ? "Enter HP." : "Enter kW.");
    if (!(pr > 0)) probs.push("Enter peak RPM.");

    return {
      ok: probs.length === 0,
      problems: probs,
      data: { make: m, family: f, cid: cidNorm, targetHp: hpNorm, peakRpm: pr, induction, usage, idle },
    };
  }

  function runAutoRecommend() {
    setStatus("");
    setResultsNote("Calculating target specs + best matches...");

    const v = validateInputs();
    if (!v.ok) {
      setStatus("Fix: " + v.problems.join(" "));
      setResultsNote("Waiting for valid inputs.");
      setTarget(null);
      setTopCams([]);
      setLastCalc(null);
      setAwaitingLibrary(false);
      return;
    }

    const inp = v.data;
    const t = computePerfectSpec(inp);
    setTarget(t);

    const calcContext = { inputs: inp, target: t } as const;
    setLastCalc(calcContext);

    if (libraryStatus === "loading") {
      setAwaitingLibrary(true);
      setTopCams([]);
      setStatus(`Loading ${feedLabel}… auto-matching once ready.`);
      setResultsNote(`Fetching ${sourceLabel} for the selected engine before scoring.`);
      return;
    }

    if (libraryStatus === "error") {
      setAwaitingLibrary(false);
      setStatus(libraryError || `Unable to load ${feedLabel}.`);
      setResultsNote("Fix the library issue, then run Suggest again.");
      setTopCams([]);
      return;
    }

    setAwaitingLibrary(false);
    scoreWithLibrary(calcContext);
  }

  function runSuggestUseMySettings() {
    runAutoRecommend();
  }

  const dispText = useMemo(() => {
    const cidNorm =
      units === "std"
        ? Number(cid)
        : Number(liters) > 0
        ? Number(liters) * CID_PER_LITER
        : 0;

    if (!(cidNorm > 0)) return "-";
    return units === "std" ? `${Math.round(cidNorm)} cid` : `${(cidNorm / CID_PER_LITER).toFixed(2)} L`;
  }, [units, cid, liters]);

  const powerText = useMemo(() => {
    const hpNorm =
      units === "std"
        ? Number(targetHp)
        : Number(targetKw) > 0
        ? Number(targetKw) * HP_PER_KW
        : 0;

    if (!(hpNorm > 0)) return "-";
    return units === "std" ? `${Math.round(hpNorm)} hp` : `${Math.round(hpNorm * KW_PER_HP)} kW`;
  }, [units, targetHp, targetKw]);

  return (
    <div id="hb-cam-suggestor">
      <div className="hb-card">
        <div className="hb-head">
          <div className="hb-badge">HB Racing 7</div>
          <div className="hb-title">{t('title')}</div>
          <div className="hb-sub">{t('subtitle')}</div>
        </div>

        <div className="hb-toprow">
          <div className="hb-field">
            <label className="hb-label">{t('units')}</label>
            <div className="hb-toggle">
              <button className={`hb-tbtn ${units === "std" ? "hb-tbtn-on" : ""}`} type="button" onClick={() => setUnits("std")}>
                {t('standard')}
              </button>
              <button className={`hb-tbtn ${units === "met" ? "hb-tbtn-on" : ""}`} type="button" onClick={() => setUnits("met")}>
                {t('metric')}
              </button>
            </div>
          </div>

          <div className="hb-field">
            <label className="hb-label">{t('induction')}</label>
            <select className="hb-input" value={induction} onChange={(e) => setInduction(e.target.value as Induction)}>
              <option value="na">{t('naturallyAspirated')}</option>
              <option value="boost">{t('boost')}</option>
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label">{t('useCase')}</label>
            <select className="hb-input" value={usage} onChange={(e) => setUsage(e.target.value as Usage)}>
              <option value="street">{t('street')}</option>
              <option value="strip">{t('strip')}</option>
              <option value="truck">{t('truck')}</option>
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label">{t('idlePreference')}</label>
            <select className="hb-input" value={idle} onChange={(e) => setIdle(e.target.value as IdlePref)}>
              <option value="smooth">{t('smooth')}</option>
              <option value="chop">{t('choppy')}</option>
              <option value="dontcare">{t('dontCare')}</option>
            </select>
          </div>
        </div>

        <div className="hb-grid">
          <div className="hb-field">
            <label className="hb-label">{t('engineMake')}</label>
            <select className="hb-input" value={make} onChange={(e) => setMake(e.target.value)}>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label">{t('engineFamily')}</label>
            <select className="hb-input" value={family} onChange={(e) => setFamily(e.target.value)}>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {units === "std" ? (
            <div className="hb-field">
              <label className="hb-label">{t('engineSizeCid')}</label>
              <input className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderCid')} value={cid} onChange={(e) => setCid(e.target.value)} />
            </div>
          ) : (
            <div className="hb-field">
              <label className="hb-label">{t('engineSizeLiters')}</label>
              <input className="hb-input" type="number" step="0.01" inputMode="decimal" placeholder={t('placeholderLiters')} value={liters} onChange={(e) => setLiters(e.target.value)} />
            </div>
          )}

          {units === "std" ? (
            <div className="hb-field">
              <label className="hb-label">{t('desiredHp')}</label>
              <input className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderHp')} value={targetHp} onChange={(e) => setTargetHp(e.target.value)} />
            </div>
          ) : (
            <div className="hb-field">
              <label className="hb-label">{t('desiredKw')}</label>
              <input className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderKw')} value={targetKw} onChange={(e) => setTargetKw(e.target.value)} />
            </div>
          )}

          <div className="hb-field">
            <label className="hb-label">{t('peakHpRpm')}</label>
            <input className="hb-input" type="number" inputMode="numeric" placeholder={t('placeholderRpm')} value={peakRpm} onChange={(e) => setPeakRpm(e.target.value)} />
          </div>

          <div className="hb-field">
            <label className="hb-label">{t('comboNotes')}</label>
            <input className="hb-input" type="text" placeholder={t('placeholderNotes')} value={comboNotes} onChange={(e) => setComboNotes(e.target.value)} />
          </div>
        </div>

        <div className="hb-actions">
          <button className="hb-btn hb-primary" type="button" onClick={runSuggestUseMySettings}>
            {t('suggest')}
          </button>
          <button className="hb-btn" type="button" onClick={resetAll}>
            {t('reset')}
          </button>
          <div className="hb-status">
            {status || (libraryStatus === "loading" ? `Loading ${feedLabel}…` : libraryStatus === "error" ? libraryError : "")}
          </div>
        </div>

        <div className="hb-results">
          <div className="hb-results-head">
            <div className="hb-results-title">{t('resultsTitle')}</div>
            <div className="hb-results-note">
              {libraryStatus === "loading"
                ? `Loading ${sourceLabel} for this make/family…`
                : libraryStatus === "error"
                ? libraryError || `Unable to load ${feedLabel}.`
                : resultsNote}
            </div>
          </div>

          {target ? (
            <div className="hb-rec hb-target">
              <div className="hb-rec-top">
                <div className="hb-rec-name">{t('perfectTargetSpecs')}</div>
                <div className="hb-pill">
                  {induction.toUpperCase()} / {usage.toUpperCase()}
                </div>
              </div>

              <div className="hb-kv">
                <div>
                  <div className="hb-k">{t('targetDur')}</div>
                  <div className="hb-v">
                    {target.durInt}/{target.durExh}
                  </div>
                </div>
                <div>
                  <div className="hb-k">{t('targetLsa')}</div>
                  <div className="hb-v">{target.lsa}</div>
                </div>
                <div>
                  <div className="hb-k">{t('targetLift')}</div>
                  <div className="hb-v">
                    {target.liftInt.toFixed(3)}/{target.liftExh.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="hb-k">{t('peakHpGoal')}</div>
                  <div className="hb-v">
                    {powerText} @ {peakRpm}
                  </div>
                </div>
                <div>
                  <div className="hb-k">{t('suggestedPowerBand')}</div>
                  <div className="hb-v">
                    {target.bandLo}-{target.bandHi} rpm
                  </div>
                </div>
                <div>
                  <div className="hb-k">{t('combo')}</div>
                  <div className="hb-v">
                    {dispText} / {target.hpPerCid} hp/cid
                  </div>
                </div>
              </div>

              <div className="hb-notes">
                <b>{t('howToUse')}</b> {t('howToUseText')}
                {" "}
                {comboNotes ? (
                  <>
                    <br />
                    <b>{t('yourNotes')}</b> {comboNotes}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {target && topCams.length === 0 ? (
            <div className="hb-rec">
              <div className="hb-rec-name">
                {t('noCamsFound', { make, family })}
              </div>
              <div className="hb-notes">
                {t('noCamsNote')}
              </div>
            </div>
          ) : null}

          {topCams.map((x, i) => {
            const cam = x.cam;
            const boostPill = cam.boostOK === "yes" ? t('boostFriendly') : cam.boostOK === "no" ? t('naFocused') : t('either');
            const label = `${cam.brand || t('unknown')} - ${cam.pn || "NO-PN"}`;
            const extraName = cam.name ? ` - ${cam.name}` : "";

            return (
              <div key={cam.id} className="hb-rec">
                <div className="hb-rec-top">
                  <div className="hb-rec-name">
                    {i + 1}. {label}
                    {extraName} <span style={{ opacity: 0.85, fontWeight: 950 }}>
                      ({cam.make} - {cam.family})
                    </span>
                  </div>
                  <div className="hb-pill">
                    {boostPill} / {t('match')} {x.match}%
                  </div>
                  {cam.sourceUrl ? (
                    <a className="hb-link" href={cam.sourceUrl} target="_blank" rel="noreferrer">
                      {t('source')}
                    </a>
                  ) : null}
                </div>

                <div className="hb-kv">
                  <div>
                    <div className="hb-k">{t('duration')}</div>
                    <div className="hb-v">
                      {cam.durInt}/{cam.durExh}
                    </div>
                  </div>
                  <div>
                    <div className="hb-k">{t('lift')}</div>
                    <div className="hb-v">
                      {fmt3(cam.liftInt)}/{fmt3(cam.liftExh)}
                    </div>
                  </div>
                  <div>
                    <div className="hb-k">{t('lsa')}</div>
                    <div className="hb-v">{cam.lsa}</div>
                  </div>
                  <div>
                    <div className="hb-k">{t('suggestedPeakHp')}</div>
                    <div className="hb-v">{cam.peakHpRpm} rpm</div>
                  </div>
                  <div>
                    <div className="hb-k">{t('distance')}</div>
                    <div className="hb-v">{x.dist.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="hb-k">{t('yourPeak')}</div>
                    <div className="hb-v">{peakRpm} rpm</div>
                  </div>
                </div>

                {cam.notes ? (
                  <div className="hb-notes">
                    <b>{t('notes')}</b> {cam.notes}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="hb-foot">{t('footer')}</div>
      </div>

      <style>{`
        #hb-cam-suggestor{max-width:980px;margin:0 auto;padding:18px 0}
        #hb-cam-suggestor,#hb-cam-suggestor *{box-sizing:border-box}
        #hb-cam-suggestor{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#eaf2ff}
        .hb-card{
          border-radius:18px;padding:18px;
          background:
            radial-gradient(900px 420px at 15% 10%, rgba(34,211,238,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(800px 380px at 85% 15%, rgba(244,114,182,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(900px 520px at 50% 105%, rgba(168,85,247,0.18), rgba(0,0,0,0) 60%),
            linear-gradient(180deg,#050816,#020617);
          border:1px solid rgba(56,189,248,0.35);
          box-shadow:0 18px 46px rgba(0,0,0,0.65);
          overflow:hidden;
        }
        .hb-head{text-align:center;padding-bottom:8px}
        .hb-badge{
          display:inline-block;font-weight:950;font-size:11px;letter-spacing:.18em;text-transform:uppercase;
          padding:6px 10px;border-radius:999px;border:1px solid rgba(56,189,248,0.55);
          background:rgba(56,189,248,0.08);color:#7dd3fc;margin-bottom:10px;
        }
        .hb-title{font-size:22px;font-weight:950;letter-spacing:.06em}
        .hb-sub{font-size:12px;color:rgba(203,213,255,0.88);margin-top:6px}

        .hb-toprow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}
        @media (max-width:900px){.hb-toprow{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:520px){.hb-toprow{grid-template-columns:1fr}}
        .hb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px}
        @media (max-width:900px){.hb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:520px){.hb-grid{grid-template-columns:1fr}}

        .hb-field{display:flex;flex-direction:column;gap:6px;min-width:0}
        .hb-label{font-size:11px;color:rgba(203,213,255,0.92);letter-spacing:.06em;text-transform:uppercase}
        .hb-input{
          width:100%;border-radius:12px;padding:10px 11px;
          border:1px solid rgba(56,189,248,0.28);background:rgba(2,6,23,0.72);
          color:#eaf2ff;outline:none
        }
        .hb-input:focus{border-color:rgba(244,114,182,0.65);box-shadow:0 0 0 3px rgba(244,114,182,0.18)}
        .hb-toggle{display:flex;gap:10px}
        .hb-tbtn{
          flex:1;border:1px solid rgba(56,189,248,0.28);background:rgba(2,6,23,0.6);color:#eaf2ff;
          padding:10px 12px;border-radius:12px;font-weight:950;letter-spacing:.04em;cursor:pointer
        }
        .hb-tbtn-on{
          border:1px solid rgba(34,211,238,0.55);
          background:linear-gradient(90deg, rgba(34,211,238,0.22), rgba(244,114,182,0.18), rgba(168,85,247,0.18));
        }

        .hb-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:14px}
        .hb-btn{
          border:1px solid rgba(56,189,248,0.28);background:rgba(2,6,23,0.6);color:#eaf2ff;
          padding:10px 12px;border-radius:12px;font-weight:950;letter-spacing:.04em;cursor:pointer
        }
        .hb-btn:hover{border-color:rgba(56,189,248,0.55)}
        .hb-primary{
          border:1px solid rgba(34,211,238,0.55);
          background:linear-gradient(90deg, rgba(34,211,238,0.22), rgba(244,114,182,0.18), rgba(168,85,247,0.18));
        }
        .hb-danger{border-color:rgba(248,113,113,0.55);background:rgba(248,113,113,0.12)}
        .hb-status{font-size:12px;color:rgba(203,213,255,0.9)}

        .hb-results{margin-top:14px}
        .hb-results-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;margin-bottom:10px}
        .hb-results-title{font-weight:950;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#7dd3fc}
        .hb-results-note{font-size:12px;color:rgba(203,213,255,0.88)}

        .hb-rec{border-radius:16px;padding:12px;border:1px solid rgba(56,189,248,0.24);background:rgba(2,6,23,0.55);margin-bottom:10px}
        .hb-rec-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
        .hb-rec-name{font-weight:950}
        .hb-pill{
          font-size:11px;padding:6px 10px;border-radius:999px;border:1px solid rgba(244,114,182,0.5);
          background:rgba(244,114,182,0.10);color:rgba(255,255,255,0.92);font-weight:950;letter-spacing:.06em
        }
        .hb-link{color:#7dd3fc;font-size:12px;font-weight:700;text-decoration:none}
        .hb-link:hover{text-decoration:underline}
        .hb-kv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        @media (max-width:700px){.hb-kv{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:420px){.hb-kv{grid-template-columns:1fr}}
        .hb-kv>div{border-radius:12px;padding:8px 10px;background:rgba(255,255,255,0.04);border:1px solid rgba(56,189,248,0.16)}
        .hb-k{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(203,213,255,0.9)}
        .hb-v{margin-top:4px;font-weight:950}
        .hb-notes{margin-top:8px;font-size:12px;color:rgba(203,213,255,0.9)}
        .hb-target{
          border:1px solid rgba(34,211,238,0.35);
          background:linear-gradient(180deg, rgba(34,211,238,0.10), rgba(2,6,23,0.55));
        }

        .hb-foot{margin-top:14px;font-size:11px;color:rgba(203,213,255,0.78);text-align:center}
      `}</style>
    </div>
  );
}

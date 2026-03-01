'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type Units = 'std' | 'met';
type Induction = 'na' | 'boost';
type Usage = 'street' | 'strip' | 'truck';
type IdlePref = 'smooth' | 'chop' | 'dontcare';
type BoostOK = 'yes' | 'no' | 'either';

type Cam = {
  id: string;
  make: string;
  family: string;
  name: string;
  durInt: number;
  durExh: number;
  liftInt: number;
  liftExh: number;
  lsa: number;
  peakHpRpm: number;
  boostOK: BoostOK;
  notes?: string;
};

const CID_PER_LITER = 61.0237441;
const KW_PER_HP = 0.745699872;
const HP_PER_KW = 1 / KW_PER_HP;

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
function fmt3(n: number) {
  return Number.isFinite(n) ? n.toFixed(3) : '';
}
function normStr(s: string) {
  return (s || '').trim();
}
function uid() {
  return 'c_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);
}

type SuggestInput = {
  make: string;
  family: string;
  cid: number;
  targetHp: number;
  peakRpm: number;
  induction: Induction;
  usage: Usage;
  idle: IdlePref;
};

const ENGINE_FAMILIES: Record<string, string[]> = {
  Ford: [
    'SBF Windsor (221/260/289/302/351W)',
    'SBF Cleveland/Modified (351C/351M/400)',
    'FE Big Block (332/352/360/390/406/427/428)',
    '385-Series Big Block (429/460)',
    'Modular 2V/3V (4.6/5.4)',
    'Coyote / Modular DOHC (5.0 Coyote)',
    'Godzilla (7.3)',
    'EcoBoost I4/I6 (2.3/2.7/3.0/3.5)',
    'Lima 2.3 (SVO/Turbo)',
    'Essex V6 (3.8/4.2)',
    'Y-Block (239/272/292/312)',
  ],
  'Chevy / GM': [
    'SBC Gen I (265–400)',
    'SBC Gen II LT1/LT4 (1992–1997)',
    'Gen III/IV LS (4.8/5.3/5.7/6.0/6.2/7.0)',
    'Gen V LT (LT1/LT2/LT4/LT5)',
    'BBC (Mark IV / Gen V / Gen VI 396–502+)',
    'Vortec I4/I5 (2.0/2.5)',
    'Ecotec (1.4/1.5/2.0/2.4)',
    'Atlas (I5/I6 3.5/4.2)',
  ],
  Mopar: [
    'LA Small Block (273/318/340/360)',
    'Magnum Small Block (5.2/5.9)',
    'Gen III Hemi (5.7/6.1/6.2/6.4)',
    'B/RB Big Block (361/383/400/413/426W/440)',
    'Slant Six (170/198/225)',
  ],
  'Toyota / Lexus': ['JZ (1JZ/2JZ)', 'UZ (1UZ/3UZ)', 'GR (2GR/3GR/4GR)', 'AR (2AR)', 'ZR (2ZR)', 'S (3S/5S)', 'A (4A/7A)', '2ZZ (Celica/Corolla XRS)'],
  'Nissan / Infiniti': ['RB (RB20/25/26)', 'SR (SR20)', 'VQ (VQ35/VQ37)', 'VR (VR30/VR38)', 'KA (KA24)', 'TB (TB42/TB48)'],
  'Honda / Acura': ['K-Series (K20/K24)', 'B-Series (B16/B18)', 'D-Series (D16)', 'H-Series (H22/H23)', 'J-Series (J32/J35/J37)'],
  Subaru: ['EJ (EJ20/EJ25)', 'FA/FB (FA20/FA24/FB20/FB25)'],
  Mitsubishi: ['4G63', '4B11', '6G72/6G74'],
  Mazda: ['BP (Miata 1.8)', 'MZR/Duratec (2.0/2.3)', 'Skyactiv-G (2.0/2.5)', 'Rotary (13B/20B/26B)'],
  'VW / Audi': ['EA888 (1.8T/2.0T Gen 1–4)', 'EA113 (2.0T FSI)', 'VR6 (2.8/3.2/3.6)', 'Audi 2.7T', 'Audi 3.0T (Supercharged)', 'Audi 4.0T'],
  BMW: ['N54/N55', 'B58', 'S55', 'S58', 'S65/S85'],
  Mercedes: ['M113', 'M156', 'M157', 'M276'],
  'Hyundai / Kia': ['Theta II (2.0T/2.4)', 'Lambda (V6)', 'Smartstream (G-series)'],
};

const BASE_CAMS: Cam[] = [
  { id: 'b1', make: 'Ford', family: 'SBF Windsor (221/260/289/302/351W)', name: 'Street 224/232 112', durInt: 224, durExh: 232, liftInt: 0.52, liftExh: 0.54, lsa: 112, peakHpRpm: 6200, boostOK: 'either', notes: 'Street/strip behavior. Likes gears/converter. Check springs.' },
  { id: 'b2', make: 'Ford', family: 'SBF Windsor (221/260/289/302/351W)', name: 'Boost 220/228 114', durInt: 220, durExh: 228, liftInt: 0.51, liftExh: 0.53, lsa: 114, peakHpRpm: 6000, boostOK: 'yes', notes: 'Turbo-friendly overlap/LSA. Broad torque.' },
  { id: 'b3', make: 'Ford', family: 'FE Big Block (332/352/360/390/406/427/428)', name: 'FE Street 230/236 112', durInt: 230, durExh: 236, liftInt: 0.56, liftExh: 0.575, lsa: 112, peakHpRpm: 5800, boostOK: 'either', notes: 'Strong midrange FE style. Great street/strip.' },
  { id: 'b4', make: 'Chevy / GM', family: 'Gen III/IV LS (4.8/5.3/5.7/6.0/6.2/7.0)', name: 'LS Street 218/226 112', durInt: 218, durExh: 226, liftInt: 0.56, liftExh: 0.56, lsa: 112, peakHpRpm: 6200, boostOK: 'either', notes: 'Common street/strip LS profile. Converter/gears help.' },
  { id: 'b5', make: 'Chevy / GM', family: 'Gen III/IV LS (4.8/5.3/5.7/6.0/6.2/7.0)', name: 'LS Boost 212/220 114', durInt: 212, durExh: 220, liftInt: 0.55, liftExh: 0.55, lsa: 114, peakHpRpm: 6000, boostOK: 'yes', notes: 'Boost-friendly overlap. Good spool and drivability.' },
  { id: 'b6', make: 'Mopar', family: 'Gen III Hemi (5.7/6.1/6.2/6.4)', name: 'Hemi Street 214/222 113', durInt: 214, durExh: 222, liftInt: 0.56, liftExh: 0.56, lsa: 113, peakHpRpm: 6100, boostOK: 'either', notes: 'Streetable torque band. Good for NA/mild boost.' },
  { id: 'b7', make: 'Mopar', family: 'Gen III Hemi (5.7/6.1/6.2/6.4)', name: 'Hemi Boost 210/218 115', durInt: 210, durExh: 218, liftInt: 0.55, liftExh: 0.55, lsa: 115, peakHpRpm: 5900, boostOK: 'yes', notes: 'Wider LSA overlap control for boost.' },
  { id: 'b8', make: 'Toyota / Lexus', family: 'JZ (1JZ/2JZ)', name: '2JZ Street 228/236 114', durInt: 228, durExh: 236, liftInt: 0.36, liftExh: 0.36, lsa: 114, peakHpRpm: 7000, boostOK: 'yes', notes: 'Turbo JZ style. Verify lift/specs for your valvetrain.' },
  { id: 'b9', make: 'Honda / Acura', family: 'K-Series (K20/K24)', name: 'K Street/Race 240/238 110', durInt: 240, durExh: 238, liftInt: 0.5, liftExh: 0.48, lsa: 110, peakHpRpm: 8600, boostOK: 'either', notes: 'High rpm NA K-style behavior. Springs/retainers required.' },
  { id: 'b10', make: 'Nissan / Infiniti', family: 'RB (RB20/25/26)', name: 'RB Boost 232/240 114', durInt: 232, durExh: 240, liftInt: 0.4, liftExh: 0.4, lsa: 114, peakHpRpm: 7800, boostOK: 'yes', notes: 'Turbo RB profile. Confirm lift/specs for your head setup.' },
];

function scoreCam(cam: Cam, inp: SuggestInput) {
  const targetRpm = inp.peakRpm;
  const targetHp = inp.targetHp;
  const cid = inp.cid;

  const durAvg = (cam.durInt + cam.durExh) / 2;

  const rpmDelta = Math.abs((cam.peakHpRpm || targetRpm) - targetRpm);
  const rpmScore = clamp(100 - (rpmDelta / 100) * 6, 0, 100);

  let indScore = 70;
  if (inp.induction === 'boost') {
    if (cam.boostOK === 'yes') indScore += 25;
    if (cam.boostOK === 'no') indScore -= 35;
    const lsaPref = 114;
    indScore += clamp(20 - Math.abs((cam.lsa || 112) - lsaPref) * 6, -25, 20);
  } else {
    const lsaPref = inp.usage === 'truck' ? 112 : 110;
    indScore += clamp(20 - Math.abs((cam.lsa || 112) - lsaPref) * 6, -20, 20);
    if (cam.boostOK === 'no') indScore += 5;
  }
  indScore = clamp(indScore, 0, 100);

  const hpPerCid = targetHp > 0 && cid > 0 ? targetHp / cid : 1.2;
  let desiredDur = 220 + (hpPerCid - 1.25) * 60;
  if (inp.induction === 'boost') desiredDur -= 6;
  desiredDur = clamp(desiredDur, 204, 244);
  const durScore = clamp(100 - Math.abs(durAvg - desiredDur) * 3.2, 0, 100);

  let useScore = 75;
  if (inp.usage === 'truck') {
    useScore += clamp(18 - (durAvg - 210) * 1.1, -25, 18);
    useScore += clamp(12 - Math.abs((cam.lsa || 112) - 112) * 4, -20, 12);
  } else if (inp.usage === 'street') {
    useScore += clamp(14 - Math.abs(durAvg - 220) * 0.9, -20, 14);
  } else if (inp.usage === 'strip') {
    useScore += clamp(14 - Math.abs(durAvg - 232) * 0.9, -20, 14);
  }
  useScore = clamp(useScore, 0, 100);

  let idleScore = 80;
  const chopFactor = durAvg - 210 + (112 - (cam.lsa || 112)) * 2.0;
  if (inp.idle === 'smooth') idleScore += clamp(18 - chopFactor * 0.6, -30, 18);
  else if (inp.idle === 'chop') idleScore += clamp(18 - Math.abs(chopFactor - 22) * 0.9, -30, 18);
  idleScore = clamp(idleScore, 0, 100);

  const total = rpmScore * 0.4 + indScore * 0.2 + durScore * 0.2 + useScore * 0.12 + idleScore * 0.08;
  return Math.round(total * 10) / 10;
}

function buildAutoSuggestions(inp: SuggestInput, compressionNotes: string): Cam[] {
  if (!(inp.cid > 0) || !(inp.targetHp > 0)) return [];

  const hpPerCid = inp.targetHp / inp.cid;
  const usageBias = inp.usage === 'strip' ? 4 : inp.usage === 'truck' ? -5 : 0;
  const baseDur = clamp(214 + (hpPerCid - 1) * 52 + usageBias, 204, 252);
  const spread = inp.induction === 'boost' ? 6 : 8;
  const rpmTarget = inp.peakRpm || Math.round(5200 + (hpPerCid - 1) * 1200);
  const lsaBase = clamp(
    inp.induction === 'boost'
      ? 113 + (hpPerCid - 1) * 1.6
      : 110 + (hpPerCid - 1) * 1.2 - (inp.idle === 'chop' ? 1.5 : 0),
    108,
    118
  );
  const liftBase = clamp(0.44 + (hpPerCid - 1) * 0.09, 0.45, inp.induction === 'boost' ? 0.65 : 0.72);
  const boostStatus: BoostOK = inp.induction === 'boost' ? 'yes' : 'either';
  const noteBase = `Auto-calculated from ${Math.round(inp.cid)} cid / ${Math.round(inp.targetHp)} hp goal${
    compressionNotes ? ` (${compressionNotes})` : ''
  }.`;

  const variants = [
    {
      label: 'HB Auto Match',
      durOffset: 0,
      lsaOffset: 0,
      liftOffset: 0,
      extraNote: 'Targets your stated RPM window using Cam Spec Elite heuristics.',
    },
    {
      label: inp.induction === 'boost' ? 'HB Auto High-Boost' : 'HB Auto Aggressive',
      durOffset: inp.induction === 'boost' ? 2 : 4,
      lsaOffset: inp.induction === 'boost' ? 1 : -1,
      liftOffset: inp.induction === 'boost' ? 0.01 : 0.015,
      extraNote:
        inp.induction === 'boost'
          ? 'Adds turbine-friendly overlap for high boost pressure ratios.'
          : 'Adds duration/overlap for strip-focused combos.',
    },
  ];

  return variants.map((variant) => {
    const durInt = Math.round(baseDur + variant.durOffset);
    const durExh = Math.round(baseDur + spread + variant.durOffset);
    const lsa = clamp(Math.round(lsaBase + variant.lsaOffset), 108, 118);
    const liftInt = Number((liftBase + variant.liftOffset).toFixed(3));
    const liftExh = Number((liftBase + variant.liftOffset + 0.015).toFixed(3));

    return {
      id: `${variant.label.toLowerCase().replace(/\s+/g, '-')}-${uid()}`,
      make: inp.make,
      family: inp.family,
      name: variant.label,
      durInt,
      durExh,
      liftInt,
      liftExh,
      lsa,
      peakHpRpm: rpmTarget,
      boostOK: boostStatus,
      notes: `${noteBase} ${variant.extraNote}`.trim(),
    } as Cam;
  });
}

export default function CamshaftSuggestorBasic() {
  const t = useTranslations('camSuggestor');
  const [units, setUnits] = useState<Units>('std');
  const [induction, setInduction] = useState<Induction>('na');
  const [usage, setUsage] = useState<Usage>('street');
  const [idle, setIdle] = useState<IdlePref>('chop');

  const makes = useMemo(() => Object.keys(ENGINE_FAMILIES).sort(), []);
  const [make, setMake] = useState<string>(makes[0] || 'Ford');
  const families = useMemo(() => (ENGINE_FAMILIES[make] || []).slice().sort(), [make]);
  const [family, setFamily] = useState<string>(families[0] || '');

  const [cid, setCid] = useState('');
  const [liters, setLiters] = useState('');
  const [targetHp, setTargetHp] = useState('');
  const [targetKw, setTargetKw] = useState('');
  const [peakRpm, setPeakRpm] = useState('');
  const [compressionNotes, setCompressionNotes] = useState('');

  const [status, setStatus] = useState('');
  const [resultsNote, setResultsNote] = useState('');
  const [recommendations, setRecommendations] = useState<{ cam: Cam; score: number }[]>([]);

  useEffect(() => {
    const fams = (ENGINE_FAMILIES[make] || []).slice().sort();
    setFamily((prev) => (fams.includes(prev) ? prev : fams[0] || ''));
  }, [make]);

  useEffect(() => {
    if (units === 'std') {
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
  }, [units, cid, liters, targetHp, targetKw]);

  function getAllCams(): Cam[] {
    return BASE_CAMS;
  }

  function resetInputs() {
    setCid('');
    setLiters('');
    setTargetHp('');
    setTargetKw('');
    setPeakRpm('');
    setCompressionNotes('');
    setInduction('na');
    setUsage('street');
    setIdle('chop');
    setStatus('');
    setResultsNote('');
    setRecommendations([]);
  }

  function validateInputs() {
    const m = normStr(make);
    const f = normStr(family);
    const pr = Number(peakRpm);

    let cidNorm = 0;
    let hpNorm = 0;

    if (units === 'std') {
      cidNorm = Number(cid);
      hpNorm = Number(targetHp);
    } else {
      const L = Number(liters);
      const kW = Number(targetKw);
      cidNorm = L > 0 ? L * CID_PER_LITER : 0;
      hpNorm = kW > 0 ? kW * HP_PER_KW : 0;
    }

    const problems: string[] = [];
    if (!m) problems.push('Choose an engine make.');
    if (!f) problems.push('Choose an engine family.');
    if (!(cidNorm > 0)) problems.push(units === 'std' ? 'Enter engine size (CID).' : 'Enter engine size (Liters).');
    if (!(hpNorm > 0)) problems.push(units === 'std' ? 'Enter desired HP.' : 'Enter desired kW.');
    if (!(pr > 0)) problems.push('Enter peak HP RPM.');

    const warns: string[] = [];
    if (pr > 9500) warns.push('Peak RPM is very high—double-check.');
    if (pr < 3000) warns.push('Peak RPM is very low—double-check.');

    return {
      ok: problems.length === 0,
      problems,
      warns,
      data: { make: m, family: f, cid: cidNorm, targetHp: hpNorm, peakRpm: pr, induction, usage, idle },
    };
  }

  function runSuggest() {
    setStatus('');
    setResultsNote('Calculating best matches…');

    const v = validateInputs();
    if (!v.ok) {
      setStatus('Fix: ' + v.problems.join(' '));
      setResultsNote('Waiting for valid inputs.');
      setRecommendations([]);
      return;
    }
    if (v.warns.length) setStatus('Note: ' + v.warns.join(' '));

    const inp = v.data;
    const cams = getAllCams()
      .filter((c) => c.make === inp.make && c.family === inp.family)
      .map((cam) => ({ cam, score: Math.round(scoreCam(cam, inp)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    let autoAdded = false;
    const finalMatches = [...cams];

    if (finalMatches.length < 3) {
      const autos = buildAutoSuggestions(inp, compressionNotes);
      for (const autoCam of autos) {
        if (finalMatches.length >= 3) break;
        finalMatches.push({ cam: autoCam, score: Math.round(scoreCam(autoCam, inp)) });
        autoAdded = true;
      }
    }

    finalMatches.sort((a, b) => b.score - a.score);

    setResultsNote(
      autoAdded
        ? `Top picks plus HB auto grind derived from ${Math.round(inp.cid)} cid / ${Math.round(inp.targetHp)} hp.`
        : `Showing top ${finalMatches.length} matches for ${inp.make} / ${inp.family}.`
    );
    setRecommendations(finalMatches);
  }

  const dispText = useMemo(() => {
    const cidNorm = units === 'std' ? Number(cid) : Number(liters) > 0 ? Number(liters) * CID_PER_LITER : 0;
    if (!(cidNorm > 0)) return '—';
    return units === 'std' ? `${Math.round(cidNorm)} cid` : `${(cidNorm / CID_PER_LITER).toFixed(2)} L`;
  }, [units, cid, liters]);

  const powerText = useMemo(() => {
    const hpNorm = units === 'std' ? Number(targetHp) : Number(targetKw) > 0 ? Number(targetKw) * HP_PER_KW : 0;
    if (!(hpNorm > 0)) return '—';
    return units === 'std' ? `${Math.round(hpNorm)} hp` : `${Math.round(hpNorm * KW_PER_HP)} kW`;
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
              <button className={`hb-tbtn ${units === 'std' ? 'hb-tbtn-on' : ''}`} type="button" onClick={() => setUnits('std')}>
                {t('standard')}
              </button>
              <button className={`hb-tbtn ${units === 'met' ? 'hb-tbtn-on' : ''}`} type="button" onClick={() => setUnits('met')}>
                {t('metric')}
              </button>
            </div>
          </div>

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbInduction">
              {t('induction')}
            </label>
            <select id="hbInduction" className="hb-input" value={induction} onChange={(e) => setInduction(e.target.value as Induction)}>
              <option value="na">{t('naturallyAspirated')}</option>
              <option value="boost">{t('boosted')}</option>
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbUsage">
              {t('primaryUse')}
            </label>
            <select id="hbUsage" className="hb-input" value={usage} onChange={(e) => setUsage(e.target.value as Usage)}>
              <option value="street">{t('street')}</option>
              <option value="strip">{t('strip')}</option>
              <option value="truck">{t('truck')}</option>
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbIdle">
              {t('idleQuality')}
            </label>
            <select id="hbIdle" className="hb-input" value={idle} onChange={(e) => setIdle(e.target.value as IdlePref)}>
              <option value="smooth">{t('smooth')}</option>
              <option value="chop">{t('choppy')}</option>
              <option value="dontcare">{t('dontCare')}</option>
            </select>
          </div>
        </div>

        <div className="hb-grid">
          <div className="hb-field">
            <label className="hb-label" htmlFor="hbMake">
              {t('engineMake')}
            </label>
            <select id="hbMake" className="hb-input" value={make} onChange={(e) => setMake(e.target.value)}>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbFamily">
              {t('engineFamily')}
            </label>
            <select id="hbFamily" className="hb-input" value={family} onChange={(e) => setFamily(e.target.value)}>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {units === 'std' ? (
            <div className="hb-field" id="hbDispStdWrap">
              <label className="hb-label" htmlFor="hbCID">
                {t('displacementCid')}
              </label>
              <input id="hbCID" className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderCid')} value={cid} onChange={(e) => setCid(e.target.value)} />
            </div>
          ) : (
            <div className="hb-field" id="hbDispMetWrap">
              <label className="hb-label" htmlFor="hbLiters">
                {t('displacementLiters')}
              </label>
              <input id="hbLiters" className="hb-input" type="number" step="0.01" inputMode="decimal" placeholder={t('placeholderLiters')} value={liters} onChange={(e) => setLiters(e.target.value)} />
            </div>
          )}

          {units === 'std' ? (
            <div className="hb-field" id="hbHpStdWrap">
              <label className="hb-label" htmlFor="hbTargetHp">
                {t('targetHorsepower')}
              </label>
              <input id="hbTargetHp" className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderHp')} value={targetHp} onChange={(e) => setTargetHp(e.target.value)} />
            </div>
          ) : (
            <div className="hb-field" id="hbHpMetWrap">
              <label className="hb-label" htmlFor="hbTargetKw">
                {t('targetKw')}
              </label>
              <input id="hbTargetKw" className="hb-input" type="number" inputMode="decimal" placeholder={t('placeholderKw')} value={targetKw} onChange={(e) => setTargetKw(e.target.value)} />
            </div>
          )}

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbPeakRpm">
              {t('peakRpm')}
            </label>
            <input id="hbPeakRpm" className="hb-input" type="number" inputMode="numeric" placeholder={t('placeholderRpm')} value={peakRpm} onChange={(e) => setPeakRpm(e.target.value)} />
          </div>

          <div className="hb-field">
            <label className="hb-label" htmlFor="hbCompression">
              {t('compressionNotes')}
            </label>
            <input
              id="hbCompression"
              className="hb-input"
              type="text"
              placeholder={t('placeholderCompressionNotes')}
              value={compressionNotes}
              onChange={(e) => setCompressionNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="hb-actions">
          <button className="hb-btn hb-primary" type="button" onClick={runSuggest}>
            {t('getSuggestions')}
          </button>
          <button className="hb-btn" type="button" onClick={resetInputs}>
            {t('reset')}
          </button>
          <div className="hb-status">{status}</div>
        </div>

        <div className="hb-results">
          <div className="hb-results-head">
            <div className="hb-results-title">{t('topMatches')}</div>
            <div className="hb-results-note">{resultsNote || t('resultsPlaceholder')}</div>
          </div>

          {recommendations.length === 0 ? (
            <div />
          ) : (
            <div>
              {recommendations.map((x, idx) => {
                const cam = x.cam;
                const boostPill = cam.boostOK === 'yes' ? 'Boost Friendly' : cam.boostOK === 'no' ? 'NA Focused' : 'Either';
                return (
                  <div key={cam.id} className="hb-rec">
                    <div className="hb-rec-top">
                      <div className="hb-rec-name">
                        {idx + 1}. {cam.name}{' '}
                        <span style={{ opacity: 0.85, fontWeight: 900 }}>
                          ({cam.make} • {cam.family})
                        </span>
                      </div>
                      <div className="hb-pill">
                        Match {x.score}% • {boostPill}
                      </div>
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
                        <div className="hb-k">{t('yourTarget')}</div>
                        <div className="hb-v">
                          {powerText} @ {peakRpm || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="hb-k">{t('engine')}</div>
                        <div className="hb-v">{dispText}</div>
                      </div>
                    </div>

                    {cam.notes ? (
                      <div className="hb-notes">
                        <b>{t('notes')}:</b> {cam.notes}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hb-foot">{t('footer')}</div>
      </div>

      <style>{`
        #hb-cam-suggestor { max-width: 980px; margin: 0 auto; padding: 18px 0; }
        #hb-cam-suggestor, #hb-cam-suggestor * { box-sizing: border-box; }
        #hb-cam-suggestor { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #eaf2ff; }

        .hb-card{
          border-radius: 18px;
          padding: 18px;
          background:
            radial-gradient(900px 420px at 15% 10%, rgba(34,211,238,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(800px 380px at 85% 15%, rgba(244,114,182,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(900px 520px at 50% 105%, rgba(168,85,247,0.18), rgba(0,0,0,0) 60%),
            linear-gradient(180deg, #050816, #020617);
          border: 1px solid rgba(56,189,248,0.35);
          box-shadow: 0 18px 46px rgba(0,0,0,0.65);
          overflow: hidden;
        }

        .hb-head{ text-align:center; padding-bottom: 8px; }
        .hb-badge{
          display:inline-block; font-weight: 800; font-size: 11px; letter-spacing: 0.18em;
          text-transform: uppercase; padding: 6px 10px; border-radius: 999px;
          border: 1px solid rgba(56,189,248,0.55); background: rgba(56,189,248,0.08);
          color: #7dd3fc; margin-bottom: 10px;
        }
        .hb-title{ font-size: 22px; font-weight: 900; letter-spacing: 0.06em; }
        .hb-sub{ font-size: 12px; color: rgba(203,213,255,0.88); margin-top: 6px; }

        .hb-toprow{
          display:grid; grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 12px; margin-top: 14px;
        }
        @media (max-width: 900px){ .hb-toprow{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 520px){ .hb-toprow{ grid-template-columns: 1fr; } }

        .hb-grid{
          display:grid; grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 12px; margin-top: 12px;
        }
        @media (max-width: 900px){ .hb-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 520px){ .hb-grid{ grid-template-columns: 1fr; } }

        .hb-field{ display:flex; flex-direction:column; gap: 6px; min-width: 0; }
        .hb-label{ font-size: 11px; color: rgba(203,213,255,0.92); letter-spacing: 0.06em; text-transform: uppercase; }
        .hb-input{
          width: 100%; border-radius: 12px; padding: 10px 11px;
          border: 1px solid rgba(56,189,248,0.28); background: rgba(2,6,23,0.72);
          color: #eaf2ff; outline: none;
        }
        .hb-input:focus{
          border-color: rgba(244,114,182,0.65);
          box-shadow: 0 0 0 3px rgba(244,114,182,0.18);
        }

        .hb-toggle{ display:flex; gap:10px; }
        .hb-tbtn{
          flex:1;
          border: 1px solid rgba(56,189,248,0.28);
          background: rgba(2,6,23,0.6);
          color: #eaf2ff;
          padding: 10px 12px;
          border-radius: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          cursor:pointer;
        }
        .hb-tbtn-on{
          border: 1px solid rgba(34,211,238,0.55);
          background: linear-gradient(90deg, rgba(34,211,238,0.22), rgba(244,114,182,0.18), rgba(168,85,247,0.18));
        }

        .hb-actions{
          display:flex; flex-wrap:wrap; align-items:center; gap: 10px; margin-top: 14px;
        }
        .hb-btn{
          border: 1px solid rgba(56,189,248,0.28);
          background: rgba(2,6,23,0.6);
          color: #eaf2ff;
          padding: 10px 12px;
          border-radius: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          cursor: pointer;
        }
        .hb-btn:hover{ border-color: rgba(56,189,248,0.55); }
        .hb-primary{
          border: 1px solid rgba(34,211,238,0.55);
          background: linear-gradient(90deg, rgba(34,211,238,0.22), rgba(244,114,182,0.18), rgba(168,85,247,0.18));
        }
        .hb-status{ font-size: 12px; color: rgba(203,213,255,0.9); }

        .hb-results{ margin-top: 14px; }
        .hb-results-head{
          display:flex; justify-content:space-between; gap: 10px; flex-wrap:wrap;
          align-items: baseline; margin-bottom: 10px;
        }
        .hb-results-title{ font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; color: #7dd3fc; }
        .hb-results-note{ font-size: 12px; color: rgba(203,213,255,0.88); }

        .hb-rec{
          border-radius: 16px; padding: 12px;
          border: 1px solid rgba(56,189,248,0.24);
          background: rgba(2,6,23,0.55);
          margin-bottom: 10px;
        }
        .hb-rec-top{
          display:flex; justify-content:space-between; gap: 10px; flex-wrap:wrap; align-items:center;
          margin-bottom: 8px;
        }
        .hb-rec-name{ font-weight: 900; }
        .hb-pill{
          font-size: 11px; padding: 6px 10px; border-radius: 999px;
          border: 1px solid rgba(244,114,182,0.5);
          background: rgba(244,114,182,0.10);
          color: rgba(255,255,255,0.92);
          font-weight: 900; letter-spacing: 0.06em;
        }
        .hb-kv{
          display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px;
        }
        @media (max-width: 700px){ .hb-kv{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 420px){ .hb-kv{ grid-template-columns: 1fr; } }
        .hb-kv > div{
          border-radius: 12px; padding: 8px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(56,189,248,0.16);
        }
        .hb-k{ font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(203,213,255,0.9); }
        .hb-v{ margin-top: 4px; font-weight: 900; }
        .hb-notes{ margin-top: 8px; font-size: 12px; color: rgba(203,213,255,0.9); }

        .hb-foot{ margin-top: 14px; font-size: 11px; color: rgba(203,213,255,0.78); text-align: center; }
      `}</style>
    </div>
  );
}

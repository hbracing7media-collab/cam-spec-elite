'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CamMakeKey, HeadMakeKey } from '../../lib/engineOptions';

interface ShortBlock {
  id: string;
  block_name: string;
  engine_make?: string;
  engine_family?: string;
  bore?: string;
  stroke?: string;
  rod_length?: string;
  cyl?: number;
  deck_height?: string;
  piston_dome_dish?: string;
  head_gasket_bore?: string;
  head_gasket_compressed_thickness?: string;
  attachedHead?: {
    id: string;
    head_name: string;
    intake_ports?: number;
    exhaust_ports?: number;
    chamber_volume?: number;
    flow_data?: any;
  } | null;
  attachedCams?: any[];
}

interface EngineGeometry {
  cid: number;
  crStatic: number;
  rod: number;
  stroke: number;
  cyl: number;
  portCfm: number;
}

interface Cam {
  name: string;
  intDur: number;
  exhDur: number;
  lsa: number;
  ivc: number;
  intLift: number;
  exhLift: number;
  rpmStart: number;
  rpmEnd: number;
  rockerRatio?: number | null;
}

interface Tune {
  intake: string;
  fuel: string;
  boostPsi: number;
  afr: number;
  rpmStart: number;
  rpmEnd: number;
  rpmStep: number;
  intercoolerEff?: number;
  compressorEff?: number;
  turboOrBlower?: string;
}

interface CurvePoint {
  rpm: number;
  hp: number;
  tq: number;
  dynCR: number;
  effCR: number;
}

interface EngineState {
  bore: number;
  stroke: number;
  rod: number;
  cyl: number;
  chamber: number;
  pistonCc: number;
  gasketBore: number;
  gasketThk: number;
  deck: number;
  portCfm: number;
}

type HeadFlowPoint = { lift: number; intakeFlow?: number; exhaustFlow?: number };
type HeadOption = {
  id: string;
  label: string;
  flowCfm: number;
  chamberCc?: number;
  flowCurve: HeadFlowPoint[];
};
type CamCatalogOption = { id: string; label: string; spec: Partial<Cam> };
type CatalogFamily = {
  id: string;
  label?: string;
  camFamily?: string;
  headFamily?: string;
  geometryKey?: string;
};
type CatalogMake = {
  id: string;
  label: string;
  camMake?: CamMakeKey;
  headMake?: HeadMakeKey;
  families: CatalogFamily[];
};

const GEOMETRY_PRESETS: Record<string, Partial<EngineState>> = {
  'ford-sbw': { bore: 4.0, stroke: 3.0, rod: 5.09, cyl: 8, chamber: 58, pistonCc: 10, gasketBore: 4.08, gasketThk: 0.04, deck: 0.012 },
  'ford-cleveland': { bore: 4.0, stroke: 3.5, rod: 5.78, cyl: 8, chamber: 64, pistonCc: 14, gasketBore: 4.1, gasketThk: 0.042, deck: 0.015 },
  'chevy-sbc': { bore: 4.0, stroke: 3.48, rod: 5.7, cyl: 8, chamber: 64, pistonCc: 12, gasketBore: 4.1, gasketThk: 0.041, deck: 0.02 },
  'chevy-bbc': { bore: 4.25, stroke: 4.0, rod: 6.135, cyl: 8, chamber: 110, pistonCc: -18, gasketBore: 4.37, gasketThk: 0.045, deck: 0.0 },
  'mopar-la': { bore: 4.0, stroke: 3.58, rod: 6.123, cyl: 8, chamber: 64, pistonCc: 8, gasketBore: 4.06, gasketThk: 0.04, deck: 0.02 },
};

const ENGINE_SELECTIONS: CatalogMake[] = [
  {
    id: 'ford',
    label: 'Ford',
    camMake: 'Ford',
    headMake: 'Ford',
    families: [
      { id: 'ford-sbw', camFamily: 'Small Block Windsor (221/260/289/302/351W)', headFamily: 'Small Block Windsor', geometryKey: 'ford-sbw' },
      { id: 'ford-cleveland', camFamily: 'Cleveland (351C/351M/400)', headFamily: 'Small Block Cleveland', geometryKey: 'ford-cleveland' },
      { id: 'ford-fe', camFamily: 'FE Big Block (352/390/406/427/428)', headFamily: 'FE Big Block' },
      { id: 'ford-385', camFamily: '385-Series (429/460)', headFamily: '385 Series (429/460)' },
      { id: 'ford-modular', camFamily: 'Modular 4.6/5.4 (2V/3V/4V)', headFamily: 'Modular 4.6/5.4' },
      { id: 'ford-coyote', camFamily: 'Coyote 5.0 (Gen 1/2/3/4)', headFamily: 'Coyote 5.0' },
      { id: 'ford-godzilla', camFamily: 'Godzilla 7.3', headFamily: 'Godzilla 7.3' },
      { id: 'ford-ecoboost-v6', camFamily: 'EcoBoost V6 (3.5/2.7)', headFamily: 'EcoBoost 2.7/3.0/3.5' },
      { id: 'ford-ecoboost-23', camFamily: 'Lima 2.3', headFamily: 'EcoBoost 2.3' },
      { id: 'ford-yblock', camFamily: 'Y-Block' },
      { id: 'ford-other', camFamily: 'Other Ford', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'chevy',
    label: 'Chevrolet / GM',
    camMake: 'Chevrolet',
    headMake: 'GM',
    families: [
      { id: 'chevy-sbc', camFamily: 'Gen I Small Block (265–400)', headFamily: 'Small Block Chevy (SBC)', geometryKey: 'chevy-sbc' },
      { id: 'chevy-lt1', camFamily: 'Gen II LT1/LT4 (1992–1997)', headFamily: 'Gen I/II LT1/LT4 (90s)' },
      { id: 'chevy-ls', camFamily: 'Gen III/IV LS (4.8/5.3/6.0/6.2 etc.)', headFamily: 'LS (Gen III/IV)' },
      { id: 'chevy-lt', camFamily: 'Gen V LT (LT1/LT4/LT2 etc.)', headFamily: 'LT (Gen V)' },
      { id: 'chevy-bbc', camFamily: 'Big Block Mark IV (396/402/427/454)', headFamily: 'Big Block Chevy (BBC)', geometryKey: 'chevy-bbc' },
      { id: 'chevy-bbc-genv', camFamily: 'Big Block Gen V/VI (454/502 etc.)', headFamily: 'Big Block Chevy (BBC)', geometryKey: 'chevy-bbc' },
      { id: 'chevy-ecotec', headFamily: 'Ecotec' },
      { id: 'chevy-duramax', headFamily: 'Duramax' },
      { id: 'chevy-other', camFamily: 'Other Chevy', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'mopar',
    label: 'Dodge / Mopar',
    camMake: 'Dodge/Mopar',
    headMake: 'Mopar',
    families: [
      { id: 'mopar-la', camFamily: 'LA Small Block (273/318/340/360)', headFamily: 'LA Small Block', geometryKey: 'mopar-la' },
      { id: 'mopar-magnum', camFamily: 'Magnum (5.2/5.9)', headFamily: 'Magnum Small Block' },
      { id: 'mopar-hemi', camFamily: 'Gen III Hemi (5.7/6.1/6.4/6.2)', headFamily: 'Gen III HEMI (5.7/6.1/6.4)' },
      { id: 'mopar-hellcat', headFamily: 'Hellcat 6.2', camFamily: 'Gen III Hemi (5.7/6.1/6.4/6.2)' },
      { id: 'mopar-rb', camFamily: 'RB Big Block (383/400/413/426W/440)', headFamily: 'B/RB Big Block' },
      { id: 'mopar-b', camFamily: 'B Big Block', headFamily: 'B/RB Big Block' },
      { id: 'mopar-slant6', camFamily: 'Slant-6', headFamily: 'Slant-6' },
      { id: 'mopar-other', camFamily: 'Other Mopar', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'toyota',
    label: 'Toyota',
    camMake: 'Toyota',
    headMake: 'Toyota',
    families: [
      { id: 'toyota-2jz', camFamily: '2JZ', headFamily: '2JZ' },
      { id: 'toyota-1jz', camFamily: '1JZ', headFamily: '1JZ' },
      { id: 'toyota-3s', headFamily: '3S' },
      { id: 'toyota-uz', camFamily: 'UZ (1UZ/2UZ/3UZ)', headFamily: '1UZ/3UZ' },
      { id: 'toyota-2uz', camFamily: 'UZ (1UZ/2UZ/3UZ)', headFamily: '2UZ' },
      { id: 'toyota-ur', camFamily: 'UR' },
      { id: 'toyota-gr', camFamily: 'GR', headFamily: 'GR (3.5/4.0/4.3)' },
      { id: 'toyota-other', camFamily: 'Other Toyota', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'honda',
    label: 'Honda',
    camMake: 'Honda',
    headMake: 'Honda',
    families: [
      { id: 'honda-b', camFamily: 'B-Series', headFamily: 'B-Series' },
      { id: 'honda-k', camFamily: 'K-Series', headFamily: 'K-Series' },
      { id: 'honda-d', camFamily: 'D-Series', headFamily: 'D-Series' },
      { id: 'honda-h', camFamily: 'H-Series', headFamily: 'H/F-Series' },
      { id: 'honda-j', camFamily: 'J-Series', headFamily: 'J-Series' },
      { id: 'honda-other', camFamily: 'Other Honda', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'nissan',
    label: 'Nissan',
    camMake: 'Nissan',
    headMake: 'Nissan',
    families: [
      { id: 'nissan-sr', camFamily: 'SR', headFamily: 'SR20' },
      { id: 'nissan-rb', camFamily: 'RB', headFamily: 'RB (RB20/25/26)' },
      { id: 'nissan-vg', camFamily: 'VG' },
      { id: 'nissan-vq', camFamily: 'VQ', headFamily: 'VQ (VQ35/37)' },
      { id: 'nissan-vr', camFamily: 'VR', headFamily: 'VR30' },
      { id: 'nissan-ka', headFamily: 'KA24' },
      { id: 'nissan-other', camFamily: 'Other Nissan', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'subaru',
    label: 'Subaru',
    camMake: 'Subaru',
    headMake: 'Subaru',
    families: [
      { id: 'subaru-ej', camFamily: 'EJ', headFamily: 'EJ' },
      { id: 'subaru-fa', camFamily: 'FA/FB', headFamily: 'FA/FB' },
      { id: 'subaru-other', camFamily: 'Other Subaru', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'mitsubishi',
    label: 'Mitsubishi',
    camMake: 'Mitsubishi',
    headMake: 'Mitsubishi',
    families: [
      { id: 'mitsu-4g63', camFamily: '4G63', headFamily: '4G63' },
      { id: 'mitsu-4b11', camFamily: '4B11', headFamily: '4B11' },
      { id: 'mitsu-other', camFamily: 'Other Mitsubishi', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'mazda',
    label: 'Mazda',
    camMake: 'Mazda',
    headMake: 'Mazda',
    families: [
      { id: 'mazda-bp', camFamily: 'BP', headFamily: 'BP' },
      { id: 'mazda-b6', camFamily: 'B6' },
      { id: 'mazda-k', camFamily: 'K-Series V6' },
      { id: 'mazda-13b', camFamily: '13B (Rotary)', headFamily: '13B Rotary' },
      { id: 'mazda-mzr', headFamily: 'MZR/Duratec' },
      { id: 'mazda-skyactiv', headFamily: 'Skyactiv' },
      { id: 'mazda-other', camFamily: 'Other Mazda', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'bmw',
    label: 'BMW',
    camMake: 'BMW',
    headMake: 'BMW',
    families: [
      { id: 'bmw-m50', camFamily: 'M50/M52' },
      { id: 'bmw-s50', camFamily: 'S50/S52' },
      { id: 'bmw-n54', camFamily: 'N54', headFamily: 'N54' },
      { id: 'bmw-n55', headFamily: 'N55' },
      { id: 'bmw-b58', camFamily: 'B58', headFamily: 'B58' },
      { id: 'bmw-s55', camFamily: 'S55', headFamily: 'S55' },
      { id: 'bmw-s58', camFamily: 'S58', headFamily: 'S58' },
      { id: 'bmw-other', camFamily: 'Other BMW', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'vag',
    label: 'VW / Audi',
    camMake: 'VW/Audi',
    headMake: 'VW/Audi',
    families: [
      { id: 'vag-18t', camFamily: '1.8T', headFamily: '1.8T' },
      { id: 'vag-20t', camFamily: '2.0T EA888', headFamily: '2.0T EA888' },
      { id: 'vag-vr6', camFamily: 'VR6', headFamily: 'VR6' },
      { id: 'vag-5cyl', camFamily: '07K 2.5', headFamily: '5-Cyl (07K)' },
      { id: 'vag-v6t', headFamily: 'Audi V6T/V8' },
      { id: 'vag-other', camFamily: 'Other VW/Audi', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'mercedes',
    label: 'Mercedes',
    camMake: 'Mercedes',
    headMake: 'Mercedes',
    families: [
      { id: 'merc-m113', camFamily: 'M113', headFamily: 'M113' },
      { id: 'merc-m112', camFamily: 'M112' },
      { id: 'merc-m156', camFamily: 'M156', headFamily: 'M156' },
      { id: 'merc-m157', camFamily: 'M157', headFamily: 'M157' },
      { id: 'merc-m177', headFamily: 'M177/M178' },
      { id: 'merc-om606', headFamily: 'OM606' },
      { id: 'merc-other', camFamily: 'Other Mercedes', headFamily: 'Other/Custom' },
    ],
  },
  {
    id: 'hyundai',
    label: 'Hyundai / Kia',
    headMake: 'Hyundai/Kia',
    families: [
      { id: 'hyundai-theta', headFamily: 'Theta II 2.0T' },
      { id: 'hyundai-lambda', headFamily: 'Lambda V6' },
      { id: 'hyundai-smartstream', headFamily: 'Smartstream' },
    ],
  },
  {
    id: 'other',
    label: 'Other / Custom',
    camMake: 'Other',
    headMake: 'Other',
    families: [
      { id: 'other-generic', camFamily: 'Other / Custom', headFamily: 'Other/Custom' },
    ],
  },
];

const DEFAULT_ROCKER_RATIO = 1.6;

function formatRatioInput(value: number) {
  const safe = Number.isFinite(value) ? value : DEFAULT_ROCKER_RATIO;
  return safe.toFixed(2);
}

function parseRatioInput(value: string, fallback: number) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function applyRockerRatio(baseLift: number | undefined, sourceRatio: number, targetRatio: number) {
  if (typeof baseLift !== 'number' || !Number.isFinite(baseLift)) return undefined;
  const source = Number.isFinite(sourceRatio) && sourceRatio > 0 ? sourceRatio : DEFAULT_ROCKER_RATIO;
  const target = Number.isFinite(targetRatio) && targetRatio > 0 ? targetRatio : source;
  if (source <= 0) return baseLift;
  return (baseLift / source) * target;
}

function formatLiftDisplay(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '—';
}

type CamFieldKey = keyof Cam;
type CamTextKey = Extract<CamFieldKey, 'name'>;
type CamNumericKey = Exclude<CamFieldKey, CamTextKey>;

type CamFieldConfig =
  | {
      key: CamTextKey;
      label: string;
      type: 'text';
    }
  | {
      key: CamNumericKey;
      label: string;
      type: 'number';
      min?: number;
      max?: number;
      step?: number;
    };

const CAM_FIELD_CONFIG: CamFieldConfig[] = [
  { key: 'name', label: 'Cam Name', type: 'text' },
  { key: 'intDur', label: 'Int Dur @ .050 (°)', type: 'number', min: 180, max: 290, step: 1 },
  { key: 'exhDur', label: 'Exh Dur @ .050 (°)', type: 'number', min: 180, max: 300, step: 1 },
  { key: 'lsa', label: 'LSA (°)', type: 'number', min: 104, max: 118, step: 1 },
  { key: 'ivc', label: 'IVC @ .050 (ABDC °)', type: 'number', min: 40, max: 90, step: 1 },
  { key: 'intLift', label: 'Int Lift (in)', type: 'number', min: 0.35, max: 0.9, step: 0.001 },
  { key: 'exhLift', label: 'Exh Lift (in)', type: 'number', min: 0.35, max: 0.9, step: 0.001 },
  { key: 'rpmStart', label: 'Cam RPM Start', type: 'number', min: 1000, max: 8000, step: 100 },
  { key: 'rpmEnd', label: 'Cam RPM End', type: 'number', min: 2000, max: 10000, step: 100 },
];

const LENGTH_KEYS: Array<keyof EngineState> = ['bore', 'stroke', 'rod', 'gasketBore', 'gasketThk', 'deck'];

const ENGINE_DEFAULT: EngineState = {
  bore: 4.03,
  stroke: 3.5,
  rod: 5.956,
  cyl: 8,
  chamber: 56,
  pistonCc: 19.5,
  gasketBore: 4.06,
  gasketThk: 0.04,
  deck: 0.015,
  portCfm: 300,
};

const CAM_DEFAULT: Cam = {
  name: 'F303+',
  intDur: 226,
  exhDur: 234,
  lsa: 114,
  ivc: 43,
  intLift: 0.585,
  exhLift: 0.574,
  rpmStart: 3000,
  rpmEnd: 6500,
  rockerRatio: DEFAULT_ROCKER_RATIO,
};

const TUNE_DEFAULT = {
  intake: 'single_plane',
  fuel: 'pump93',
  boostPsi: 0,
  afr: 12.0,
  intercoolerEff: 0.7,
  compressorEff: 0.72,
  turboOrBlower: 'turbo',
  graphRpmStart: 2000,
  graphRpmEnd: 7000,
  rpmStep: 250,
};

export default function CamSpecEliteSelectiveCalculator({ shortBlocks = [] }: { shortBlocks?: ShortBlock[] } = {}) {

  const [engine, setEngine] = useState<EngineState>(ENGINE_DEFAULT);
  const [selectedShortBlockId, setSelectedShortBlockId] = useState<string>('');
  const [cam, setCam] = useState<Cam>(CAM_DEFAULT);
  const [camDrafts, setCamDrafts] = useState<Partial<Record<CamFieldKey, string>>>({});
  const [tune, setTune] = useState(TUNE_DEFAULT);
  const [selectedMakeId, setSelectedMakeId] = useState<string>(ENGINE_SELECTIONS[0]?.id ?? '');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(ENGINE_SELECTIONS[0]?.families[0]?.id ?? '');
  const [selectedCatalogCam, setSelectedCatalogCam] = useState('');
  const [selectedHead, setSelectedHead] = useState('');
  const [camOptions, setCamOptions] = useState<CamCatalogOption[]>([]);
  const [camLoading, setCamLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [headOptions, setHeadOptions] = useState<HeadOption[]>([]);
  const [headLoading, setHeadLoading] = useState(false);
  const [headError, setHeadError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [chartData, setChartData] = useState<CurvePoint[]>([]);
  const [geomDisplay, setGeomDisplay] = useState({ cid: '-', crStatic: '-' });

  // Debug: show selected block, attached head, and headOptions
  const debugBlock = shortBlocks.find(b => b.id === selectedShortBlockId);
  const debugAttachedHead = debugBlock?.attachedHead;
  const [dynCrDisplay, setDynCrDisplay] = useState('-');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [catalogRockerInput, setCatalogRockerInput] = useState(() => formatRatioInput(DEFAULT_ROCKER_RATIO));
  const [userRockerInput, setUserRockerInput] = useState(() => formatRatioInput(DEFAULT_ROCKER_RATIO));
  const [userRockerDirty, setUserRockerDirty] = useState(false);
  const userRockerDirtyRef = useRef(false);

  useEffect(() => {
    userRockerDirtyRef.current = userRockerDirty;
  }, [userRockerDirty]);

  const catalogRockerRatio = useMemo(
    () => parseRatioInput(catalogRockerInput, DEFAULT_ROCKER_RATIO),
    [catalogRockerInput]
  );

  const userRockerRatio = useMemo(
    () => parseRatioInput(userRockerInput, catalogRockerRatio),
    [userRockerInput, catalogRockerRatio]
  );

  const effectiveIntLift = useMemo(
    () => applyRockerRatio(cam.intLift, catalogRockerRatio, userRockerRatio),
    [cam.intLift, catalogRockerRatio, userRockerRatio]
  );

  const effectiveExhLift = useMemo(
    () => applyRockerRatio(cam.exhLift, catalogRockerRatio, userRockerRatio),
    [cam.exhLift, catalogRockerRatio, userRockerRatio]
  );

  const selectedMake = selectedMakeId ? ENGINE_SELECTIONS.find((m) => m.id === selectedMakeId) ?? ENGINE_SELECTIONS[0] : ENGINE_SELECTIONS[0];
  const availableFamilies = selectedMake?.families ?? [];
  const selectedFamily = selectedFamilyId ? availableFamilies.find((f) => f.id === selectedFamilyId) ?? availableFamilies[0] : availableFamilies[0];
  const camQuery = selectedMake?.camMake && selectedFamily?.camFamily
    ? { make: selectedMake.camMake, family: selectedFamily.camFamily }
    : null;
  const headQuery = selectedMake?.headMake && selectedFamily?.headFamily
    ? { make: selectedMake.headMake, family: selectedFamily.headFamily }
    : null;
  const camFetchKey = camQuery ? `${camQuery.make}::${camQuery.family}` : '';
  const headFetchKey = headQuery ? `${headQuery.make}::${headQuery.family}` : '';

  useEffect(() => {
    if (!availableFamilies.length) {
      if (selectedFamilyId) {
        setSelectedFamilyId('');
        setSelectedCatalogCam('');
        setSelectedHead('');
      }
      return;
    }
    if (!selectedFamilyId || !availableFamilies.some((fam) => fam.id === selectedFamilyId)) {
      setSelectedFamilyId(availableFamilies[0].id);
      setSelectedCatalogCam('');
      setSelectedHead('');
    }
  }, [availableFamilies, selectedFamilyId]);

  // --------- Unit Conversion Helpers ---------
  const IN_TO_MM = 25.4;
  const CID_TO_CC = 16.387;
  
  function toggleUnitSystem() {
    const newSystem = unitSystem === 'imperial' ? 'metric' : 'imperial';
    setUnitSystem(newSystem);
    
    // Convert engine values
    if (newSystem === 'metric') {
      setEngine({
        bore: parseFloat((engine.bore * IN_TO_MM).toFixed(2)),
        stroke: parseFloat((engine.stroke * IN_TO_MM).toFixed(2)),
        rod: parseFloat((engine.rod * IN_TO_MM).toFixed(2)),
        cyl: engine.cyl,
        chamber: engine.chamber,
        pistonCc: engine.pistonCc,
        gasketBore: parseFloat((engine.gasketBore * IN_TO_MM).toFixed(2)),
        gasketThk: parseFloat((engine.gasketThk * IN_TO_MM).toFixed(2)),
        deck: parseFloat((engine.deck * IN_TO_MM).toFixed(2)),
        portCfm: engine.portCfm,
      });
    } else {
      setEngine({
        bore: parseFloat((engine.bore / IN_TO_MM).toFixed(3)),
        stroke: parseFloat((engine.stroke / IN_TO_MM).toFixed(3)),
        rod: parseFloat((engine.rod / IN_TO_MM).toFixed(3)),
        cyl: engine.cyl,
        chamber: engine.chamber,
        pistonCc: engine.pistonCc,
        gasketBore: parseFloat((engine.gasketBore / IN_TO_MM).toFixed(3)),
        gasketThk: parseFloat((engine.gasketThk / IN_TO_MM).toFixed(3)),
        deck: parseFloat((engine.deck / IN_TO_MM).toFixed(3)),
        portCfm: engine.portCfm,
      });
    }
  }

  function syncUserRockerToCatalog() {
    setUserRockerInput(formatRatioInput(catalogRockerRatio));
    setUserRockerDirty(false);
  }

  function handleMakeChange(value: string) {
    setSelectedMakeId(value);
    const nextFamilies = ENGINE_SELECTIONS.find((m) => m.id === value)?.families ?? [];
    setSelectedFamilyId(nextFamilies[0]?.id ?? '');
    setSelectedCatalogCam('');
    setSelectedHead('');
  }

  function handleFamilyChange(value: string) {
    setSelectedFamilyId(value);
    setSelectedCatalogCam('');
    setSelectedHead('');
  }

  useEffect(() => {
    if (!selectedFamily?.geometryKey) return;
    const preset = GEOMETRY_PRESETS[selectedFamily.geometryKey];
    if (!preset) return;

    setEngine((prev) => {
      const patch: Partial<EngineState> = {};
      Object.entries(preset).forEach(([key, rawVal]) => {
        if (typeof rawVal !== 'number') return;
        const typedKey = key as keyof EngineState;
        if (LENGTH_KEYS.includes(typedKey)) {
          const converted = unitSystem === 'imperial' ? rawVal : rawVal * IN_TO_MM;
          patch[typedKey] = parseFloat(converted.toFixed(unitSystem === 'imperial' ? 3 : 2)) as EngineState[typeof typedKey];
        } else {
          patch[typedKey] = rawVal as EngineState[typeof typedKey];
        }
      });
      return { ...prev, ...patch } as EngineState;
    });
  }, [selectedFamily?.geometryKey, unitSystem]);

  useEffect(() => {
    if (!camQuery) {
      setCamOptions([]);
      setCamLoading(false);
      setCamError(null);
      setSelectedCatalogCam('');
      return;
    }

    let canceled = false;
    setCamLoading(true);
    setCamError(null);

    (async () => {
      try {
        const params = new URLSearchParams({ make: camQuery.make, family: camQuery.family });
        const res = await fetch(`/api/cams/search?${params.toString()}`, { cache: 'no-store' });
        const payload = await res.json().catch(() => ({}));
        if (canceled) return;
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.message || `Failed to load cams (${res.status})`);
        }

        const mapped: CamCatalogOption[] = (payload.cams ?? []).map((row: any) => {
          const labelParts = [row.brand, row.cam_name, row.part_number].filter(Boolean);
          const label = labelParts.join(' • ') || 'Unknown Cam';
          const spec: Partial<Cam> = {
            name: row.cam_name ?? CAM_DEFAULT.name,
            intDur: pickNumber([row.duration_int_050, row.spec?.dur_int_050], CAM_DEFAULT.intDur),
            exhDur: pickNumber([row.duration_exh_050, row.spec?.dur_exh_050], CAM_DEFAULT.exhDur),
            lsa: pickNumber([row.lsa, row.spec?.lsa], CAM_DEFAULT.lsa),
            ivc: pickNumber([row.spec?.ivc, CAM_DEFAULT.ivc], CAM_DEFAULT.ivc),
            intLift: pickNumber([row.lift_int, row.spec?.lift_int], CAM_DEFAULT.intLift),
            exhLift: pickNumber([row.lift_exh, row.spec?.lift_exh], CAM_DEFAULT.exhLift),
            rpmStart: pickNumber([row.rpm_start, row.spec?.rpm_start, row.spec?.rpmStart], CAM_DEFAULT.rpmStart),
            rpmEnd: pickNumber([row.rpm_end, row.spec?.rpm_end, row.spec?.rpmEnd], CAM_DEFAULT.rpmEnd),
            rockerRatio: pickNumber([row.rocker_ratio, row.spec?.rocker_ratio], DEFAULT_ROCKER_RATIO),
          };
          return { id: row.id ?? label, label, spec };
        });

        setCamOptions(mapped);
        if (!mapped.some((c) => c.id === selectedCatalogCam)) {
          setSelectedCatalogCam('');
        }
      } catch (err) {
        if (canceled) return;
        setCamOptions([]);
        setSelectedCatalogCam('');
        setCamError(err instanceof Error ? err.message : 'Failed to load cam library');
      } finally {
        if (!canceled) {
          setCamLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [camFetchKey]);

  useEffect(() => {
    if (!headQuery) {
      setHeadOptions([]);
      setHeadLoading(false);
      setHeadError(null);
      setSelectedHead('');
      return;
    }

    let canceled = false;
    setHeadLoading(true);
    setHeadError(null);

    (async () => {
      try {
        const params = new URLSearchParams({ make: headQuery.make, family: headQuery.family });
        const res = await fetch(`/api/cylinder-heads/search?${params.toString()}`, { cache: 'no-store' });
        const payload = await res.json().catch(() => ({}));
        if (canceled) return;
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.message || `Failed to load heads (${res.status})`);
        }

        const mapped: HeadOption[] = (payload.heads ?? []).map((row: any) => {
          const labelParts = [row.brand, row.part_name ?? row.part_number].filter(Boolean);
          const label = labelParts.join(' • ') || 'Cylinder Head';
          const flowData = Array.isArray(row.flow_data) ? row.flow_data : [];
          const flowCurve = flowData
            .map((entry: any) => {
              const lift = coerceNumber(entry?.lift);
              const intakeFlow = coerceNumber(entry?.intakeFlow);
              const exhaustFlow = coerceNumber(entry?.exhaustFlow);
              if (typeof lift !== 'number') return null;
              if (intakeFlow === undefined && exhaustFlow === undefined) return null;
              return { lift, intakeFlow, exhaustFlow } as HeadFlowPoint;
            })
            .filter((point): point is HeadFlowPoint => Boolean(point))
            .sort((a, b) => a.lift - b.lift);

          const peakFlow = flowCurve.reduce((max, point) => {
            const candidate = point.intakeFlow ?? point.exhaustFlow ?? 0;
            return candidate > max ? candidate : max;
          }, 0);

          const chamberCc = coerceNumber(row.chamber_cc);

          return {
            id: row.id ?? label,
            label,
            flowCfm: peakFlow || ENGINE_DEFAULT.portCfm,
            chamberCc: typeof chamberCc === 'number' ? chamberCc : undefined,
            flowCurve,
          } satisfies HeadOption;
        });

        setHeadOptions(mapped);
        if (!mapped.some((h) => h.id === selectedHead)) {
          setSelectedHead(mapped[0]?.id ?? '');
        }
      } catch (err) {
        if (canceled) return;
        setHeadOptions([]);
        setSelectedHead('');
        setHeadError(err instanceof Error ? err.message : 'Failed to load head library');
      } finally {
        if (!canceled) {
          setHeadLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [headFetchKey]);

  useEffect(() => {
    if (!selectedHead) return;
    const headSpec = headOptions.find((h) => h.id === selectedHead);
    if (!headSpec || typeof headSpec.chamberCc !== 'number') return;
    setEngine((prev) => {
      if (Math.abs(prev.chamber - headSpec.chamberCc) < 0.01) {
        return prev;
      }
      return { ...prev, chamber: headSpec.chamberCc };
    });
  }, [selectedHead, headOptions]);

  useEffect(() => {
    if (!selectedHead) return;
    const headSpec = headOptions.find((h) => h.id === selectedHead);
    if (!headSpec) return;
    const interpolated = interpolateHeadFlow(headSpec.flowCurve, effectiveIntLift ?? cam.intLift);
    setEngine((prev) => {
      const fallbackFlow = headSpec.flowCfm ?? prev.portCfm;
      const desiredFlow = typeof interpolated === 'number' ? interpolated : fallbackFlow;
      if (!Number.isFinite(desiredFlow) || Math.abs(prev.portCfm - desiredFlow) < 0.01) {
        return prev;
      }
      return { ...prev, portCfm: desiredFlow };
    });
  }, [selectedHead, headOptions, effectiveIntLift, cam.intLift]);

  useEffect(() => {
    if (!selectedCatalogCam) return;
    const camSpec = camOptions.find((c) => c.id === selectedCatalogCam);
    if (camSpec?.spec) {
      setCam((prev) => ({ ...prev, ...camSpec.spec }));
      setCamDrafts({});

      const nextRatio = typeof camSpec.spec.rockerRatio === 'number' && camSpec.spec.rockerRatio > 0
        ? camSpec.spec.rockerRatio
        : DEFAULT_ROCKER_RATIO;
      setCatalogRockerInput(formatRatioInput(nextRatio));
      if (!userRockerDirtyRef.current) {
        setUserRockerInput(formatRatioInput(nextRatio));
      }
    }
  }, [selectedCatalogCam, camOptions]);

  // Auto-load attached head from short block
  // Always inject attached head from short block into headOptions and select it
  useEffect(() => {
    if (!selectedShortBlockId || shortBlocks.length === 0) return;
    const block = shortBlocks.find(b => b.id === selectedShortBlockId);
    if (block?.attachedHead?.id) {
      // Remove any previous injected attached head with the same id
      setHeadOptions(prev => {
        const filtered = prev.filter(h => h.id !== block.attachedHead!.id);
        // Build a complete HeadOption from attachedHead
        const ah = block.attachedHead;
        const flowCurve = Array.isArray(ah.flow_data)
          ? ah.flow_data.map((fd: any) => ({
              lift: Number(fd.lift) || 0,
              intakeFlow: Number(fd.intakeFlow) || undefined,
              exhaustFlow: Number(fd.exhaustFlow) || undefined,
            })).filter((pt: any) => typeof pt.lift === 'number' && (pt.intakeFlow || pt.exhaustFlow))
          : [];
        const peakFlow = flowCurve.reduce((max, pt) => {
          const candidate = pt.intakeFlow ?? pt.exhaustFlow ?? 0;
          return candidate > max ? candidate : max;
        }, 0);
        const injected: HeadOption = {
          id: ah.id,
          label: ah.head_name || 'Attached Head',
          flowCfm: peakFlow || ENGINE_DEFAULT.portCfm,
          chamberCc: ah.chamber_volume ?? undefined,
          flowCurve,
        };
        return [injected, ...filtered];
      });
      setSelectedHead(block.attachedHead.id);
    }
  }, [selectedShortBlockId, shortBlocks]);

  // --------- Engine Geometry & Compression Ratios ---------
  function computeEngineGeometry() {
    const PI = Math.PI;
    const CC_TO_IN3 = 0.0610237441;

    // Cross-sectional areas
    const A = (PI / 4) * engine.bore * engine.bore;
    const Ag = (PI / 4) * engine.gasketBore * engine.gasketBore;

    // Volumes in cubic inches
    const Vs = A * engine.stroke;
    const Vch = engine.chamber * CC_TO_IN3;
    const Vp = engine.pistonCc * CC_TO_IN3; // positive = dome, negative = dish
    const Vg = Ag * engine.gasketThk;
    const Vd = A * engine.deck;

    // Clearance volume
    const Vc = Vch + Vp + Vg + Vd;

    // Static CR
    const crStatic = (Vs + Vc) / Vc;

    // CID
    const cid = Vs * engine.cyl;

    return { cid, crStatic, Vc, A, Vs };
  }

  function calculateDynamicAndStaticCR() {
    const geom = computeEngineGeometry();
    const PI = Math.PI;

    // Piston position at IVC (Intake Valve Closing)
    const r = engine.stroke / 2;
    const l = engine.rod;
    const phi = (180 + cam.ivc) * (PI / 180);
    const sinp = Math.sin(phi);
    const cosp = Math.cos(phi);

    const underSqrt = l * l - (r * sinp) * (r * sinp);
    if (underSqrt < 0) return { crStatic: geom.crStatic, crDynamic: geom.crStatic };

    const x = r * (1 - cosp) + l - Math.sqrt(underSqrt);

    // Dynamic CR at IVC
    const crDynamic = (geom.Vc + geom.A * x) / geom.Vc;

    return { crStatic: geom.crStatic, crDynamic };
  }

  // --------- Helper Functions ---------
  function clamp(x: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, x));
  }

  function coerceNumber(value: any): number | undefined {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : undefined;
  }

  function pickNumber(values: Array<any>, fallback?: number): number | undefined {
    for (const val of values) {
      const num = coerceNumber(val);
      if (typeof num === 'number') return num;
    }
    return fallback;
  }

  function isTransientNumberInput(value: string) {
    return value === '' || value === '-' || value === '.' || value === '-.';
  }

  function getCamFieldDisplayValue(field: CamFieldConfig) {
    const draft = camDrafts[field.key];
    if (typeof draft === 'string') {
      return draft;
    }
    const rawValue = cam[field.key];
    if (field.type === 'number') {
      const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      return Number.isFinite(numericValue) ? String(numericValue) : '';
    }
    return (rawValue as string) ?? '';
  }

  function handleCamFieldChange(field: CamFieldConfig, rawValue: string) {
    if (field.type === 'number') {
      if (isTransientNumberInput(rawValue)) {
        setCamDrafts((prev) => ({ ...prev, [field.key]: rawValue }));
        return;
      }

      const parsed = parseFloat(rawValue);
      if (Number.isNaN(parsed)) {
        setCamDrafts((prev) => ({ ...prev, [field.key]: rawValue }));
        return;
      }

      setCam((prev) => ({ ...prev, [field.key]: parsed }));
      setCamDrafts((prev) => {
        if (!(field.key in prev)) return prev;
        const next = { ...prev };
        delete next[field.key];
        return next;
      });
      return;
    }

    setCam((prev) => ({ ...prev, [field.key]: rawValue }));
  }

  function handleCamFieldBlur(field: CamFieldConfig) {
    setCamDrafts((prev) => {
      if (!(field.key in prev)) return prev;
      const next = { ...prev };
      delete next[field.key];
      return next;
    });
  }

  function getPointFlowValue(point?: HeadFlowPoint) {
    if (!point) return undefined;
    return point.intakeFlow ?? point.exhaustFlow;
  }

  function interpolateHeadFlow(points: HeadFlowPoint[], liftValue?: number) {
    if (!points.length) return undefined;
    const lift = typeof liftValue === 'number' && Number.isFinite(liftValue) ? liftValue : undefined;
    if (lift === undefined) {
      return getPointFlowValue(points[points.length - 1]);
    }

    if (lift <= points[0].lift) {
      return getPointFlowValue(points[0]);
    }
    const lastPoint = points[points.length - 1];
    if (lift >= lastPoint.lift) {
      return getPointFlowValue(lastPoint);
    }

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      if (lift < current.lift || lift > next.lift) continue;
      const flowA = getPointFlowValue(current);
      const flowB = getPointFlowValue(next);
      if (flowA === undefined || flowB === undefined) continue;
      const span = next.lift - current.lift;
      if (span <= 0) return flowA;
      const ratio = (lift - current.lift) / span;
      return flowA + (flowB - flowA) * ratio;
    }

    return getPointFlowValue(lastPoint);
  }

  function getFamilyLabel(family?: CatalogFamily) {
    if (!family) return 'Custom';
    if (family.label) return family.label;
    const names = [family.camFamily, family.headFamily].filter(Boolean) as string[];
    if (names.length === 0) return 'Custom';
    const unique = Array.from(new Set(names));
    return unique.join(' • ');
  }

  function calcPeakHpFromInputs(
    manifoldStage: number,
    intakeDur050: number,
    intakeLift: number,
    lsaAngle: number,
    tappetType: string,
    dynamicCR: number,
    displacementCID: number,
    cylinders: number,
    peakIntakeFlowCFM: number
  ) {
    const stg = Math.min(5, Math.max(1, Math.round(manifoldStage) || 1));
    const dur = Math.max(150, intakeDur050 || 0);
    const lift = Math.max(0.35, intakeLift || 0.5);
    const lsa = Math.max(104, Math.min(118, lsaAngle || 110));
    const dcr = Math.max(5.0, Math.min(11.0, dynamicCR || 0));
    const cid = Math.max(1, displacementCID || 0);
    const cyl = Math.max(1, cylinders || 0);
    const cfm = Math.max(1, peakIntakeFlowCFM || 0);
    const isRoller = tappetType === 'roller';

    const manifoldMultByStage: Record<number, number> = {
      1: 0.92,   // reduced from 0.96
      2: 0.97,   // reduced from 1.0
      3: 1.00,   // reduced from 1.04
      4: 1.03,   // reduced from 1.08
      5: 1.06,   // reduced from 1.12
    };
    const manifoldMult = manifoldMultByStage[stg] ?? 1.0;
    const camMult = clamp(0.85 + (dur - 200) * 0.003, 0.78, 1.15);  // reduced cam effect
    const tappetMult = isRoller ? 1.015 : 1.0;  // reduced roller bonus from 1.03
    const dcrMult = clamp(1.0 + (dcr - 8.0) * 0.12, 0.75, 1.18);  // reduced CR effect

    // Lift effect: 0.35in baseline, each 0.1in adds ~2% power
    const liftMult = clamp(1.0 + (lift - 0.5) * 0.15, 0.85, 1.18);
    
    // LSA effect: 110° is optimal, narrower = more overlap/aggressive (up to +3%), wider = calmer (-2%)
    const lsaDev = Math.abs(lsa - 110);
    const lsaMult = clamp(1.03 - (lsaDev * 0.015), 0.98, 1.03);

    const cidPerCyl = cid / cyl;
    const cidUse = clamp(Math.pow(cidPerCyl / 50.0, 0.35), 0.75, 1.12);  // reduced max from 1.18

    const k = 0.20;  // reduced from 0.252 for more realistic power
    const baseHP =
      cfm * cyl * k *
      manifoldMult * camMult * tappetMult * dcrMult * cidUse * liftMult * lsaMult;

    let peakRpm =
      4300 +
      (dur - 210) * 22 +
      (stg - 1) * 180 +
      (isRoller ? 120 : 0) +
      (lift - 0.5) * 200;  // higher lift pushes peak RPM up

    peakRpm *= clamp(Math.sqrt(50.0 / cidPerCyl), 0.78, 1.12);
    peakRpm = clamp(peakRpm, 2500, 8500);

    return {
      baseHP: Math.round(baseHP * 10) / 10,
      peakRpm: Math.round(peakRpm),
    };
  }

  // --------- Fuel/AFR/Boost Helper Functions ---------
  function getFuelModel(type: string): any {
    const key = String(type || '').toLowerCase().trim().replace('pump', '');

    if (key === '91') {
      return {
        name: '91',
        bestPowerAfr: 12.7,
        afrTolerance: 0.65,
        powerMult: 0.985,
        heatSensitivity: 1.1,
      };
    }
    if (key === 'race_gas' || key === 'racegas' || key === '110' || key === '116') {
      return {
        name: 'Race Gas',
        bestPowerAfr: 12.9,
        afrTolerance: 0.7,
        powerMult: 1.02,
        heatSensitivity: 0.9,
      };
    }
    if (key === 'e85' || key === 'ethanol') {
      return {
        name: 'E85',
        bestPowerAfr: 7.9,
        afrTolerance: 0.55,
        powerMult: 1.0,  // Not used for E85 (uses e85BoostMult instead)
        heatSensitivity: 0.78,
      };
    }
    return {
      name: '93',
      bestPowerAfr: 12.8,
      afrTolerance: 0.65,
      powerMult: 1.0,
      heatSensitivity: 1.0,
    };
  }

  function afrPowerMultiplier(actual: number, target: number, tol: number): number {
    const a = Number(actual);
    const t = Number(target);
    // Very wide curve: sigma = 1.2 means ±1.2 AFR is 1 std dev
    // At ±3 std dev (e.g., 12.8 ± 3.6), power is only 0.5% down
    // At ±2 std dev (e.g., 12.8 ± 2.4), power is ~2.5% down
    const sigma = 1.2;
    const z = (a - t) / sigma;
    const mult = Math.exp(-0.5 * z * z);
    // Only 3.5% penalty at the edges (cut 7% in half)
    return clamp(mult, 0.965, 1.0);
  }

  // --------- Factors ---------
  function fuelFactor(fuel: string) {
    if (fuel === 'e85') return 1.07;
    if (fuel === 'race_gas') return 1.04;
    if (fuel === 'pump93') return 1.02;
    return 1.0;
  }

  function intakeFactor(intake: string) {
    if (intake === 'dual_plane') return 0.96;
    if (intake === 'single_plane') return 1.0;
    if (intake === 'tunnel_ram') return 1.05;
    if (intake === 'boosted') return 1.02;
    return 1.0;
  }

  function boostFactor(boostPsi: number, fuel: string) {
    if (boostPsi <= 0) return 1.0;
    const eff = fuel === 'e85' || fuel === 'race_gas' ? 0.92 : 0.85;
    const pr = 1 + boostPsi / 14.7;
    return 1 + (pr - 1) * eff;
  }

  function afrFactor(afr: number, fuel: string) {
    const target = fuel === 'e85' ? 11.0 : 12.5;
    const diff = afr - target;
    return 1 - Math.min(Math.abs(diff) * 0.02, 0.15);
  }

  // --------- Peak HP with Boost/AFR/Fuel Model ---------
  function estimateNaHp(eng: any, cam: any, tune: any) {
    const crData = calculateDynamicAndStaticCR();
    const dynCR = crData.crDynamic;

    // Map intake type to manifold stage
    const intakeToStage: Record<string, number> = {
      'dual_plane': 1,
      'single_plane': 2.5,
      'tunnel_ram': 4.5,
      'boosted': 2,
    };
    const manifoldStage = intakeToStage[tune.intake] ?? 2;
    const tappetType = 'roller';

    // Get base NA HP
    const naCalc = calcPeakHpFromInputs(
      manifoldStage,
      cam.intDur,
      cam.intLift,
      cam.lsa,
      tappetType,
      dynCR,
      eng.cid,
      eng.cyl,
      eng.portCfm
    );

    const naHP = naCalc.baseHP;
    let naPeakRpm = naCalc.peakRpm;

    // Fuel model
    const fuel = getFuelModel(tune.fuel);
    const targetAfr = tune.afr || fuel.bestPowerAfr;
    const afrMult = afrPowerMultiplier(targetAfr, fuel.bestPowerAfr, fuel.afrTolerance);
    const fuelMult = fuel.powerMult;

    // Boost model
    const psi = Math.max(0, tune.boostPsi || 0);
    const amb = 14.7;
    const PR = (amb + psi) / amb;

    const ic = clamp(tune.intercoolerEff, 0, 1);
    const ce = clamp(tune.compressorEff || 0.72, 0.4, 0.85);
    const heatSensitivity = fuel.heatSensitivity;
    const rawHeatPenalty = (PR - 1) * 0.12 * heatSensitivity;
    const coolingCredit = ic * 0.65 + (ce - 0.6) * 0.5;
    const heatPenalty = clamp(rawHeatPenalty * (1 - coolingCredit), 0, 0.25);

    const driveLoss = String(tune.turboOrBlower).toLowerCase().includes('blower')
      ? clamp(psi * 0.004, 0, 0.1)
      : 0.0;

    const boostMult = Math.max(1, PR * (1 - heatPenalty) * (1 - driveLoss));

    // E85 boost enhancement: +10% at 0psi scaling to +25-30% at 30psi
    let e85BoostMult = 1.0;
    let actualFuelMult = fuelMult;  // Use actual fuel multiplier
    
    if (String(tune.fuel).toLowerCase().includes('e85')) {
      // For E85, replace fuelMult with direct boost curve (don't double-apply)
      // Linear ramp from 1.10 at 0psi to 1.26 at 30psi (10% to 26% gain)
      e85BoostMult = 1.10 + clamp(psi / 30.0, 0, 1) * 0.16;
      actualFuelMult = 1.0;  // Don't apply fuelMult for E85, use e85BoostMult instead
    }

    // Final HP with E85 boost enhancement
    const boostedHP = naHP * boostMult * afrMult * actualFuelMult * e85BoostMult;

    // Peak RPM is set to cam's specified rpmEnd
    const peakRpm = Math.round(Math.max(2500, cam.rpmEnd || 6500));

    // Torque at peak HP RPM
    const tqAtHp = (boostedHP * 5252) / peakRpm;

    return { hp: boostedHP, dynCR, hpRpm: peakRpm, tqAtHp };
  }

  // --------- Build Curve ---------
  function buildCurve(eng: any, cam: any, tune: any, dynCR: number, hpData: any) {
    const hpPeak = hpData.hp || 0;
    
    const startRpm = tune.rpmStart || 2000;
    const endRpm = tune.rpmEnd || 7000;
    
    // Peak HP occurs at the cam's specified RPM end
    const hpRpm = cam.rpmEnd || endRpm;
    
    // Effective CR under boost
    const psi = Math.max(0, tune.boostPsi || 0);
    const amb = 14.7;
    const PR = (amb + psi) / amb;
    const effCR = dynCR * PR;

    const rpmStep = 250;

    const upSpan = Math.max(500, hpRpm - startRpm);
    const downSpan = Math.max(800, endRpm - hpRpm);

    const points: CurvePoint[] = [];

    for (let r = startRpm; r <= endRpm; r += rpmStep) {
      if (hpPeak <= 0 || r <= 0) {
        points.push({ rpm: r, hp: 0, tq: 0, dynCR, effCR });
        continue;
      }

      let shape;
      if (r <= hpRpm) {
        const tRaw = (r - startRpm) / upSpan;
        const t = Math.max(0, Math.min(1, tRaw));
        shape = 0.2 + 0.8 * Math.pow(t, 1.6);
      } else {
        const tRaw = (r - hpRpm) / downSpan;
        const t = Math.max(0, Math.min(1, tRaw));
        shape = 1.0 - 0.95 * Math.pow(t, 1.4);
        if (shape < 0.05) shape = 0.05;
      }

      const hp = hpPeak * shape;
      const tq = (hp * 5252) / r;

      points.push({ rpm: r, hp, tq, dynCR, effCR });
    }

    return { points, dynCR, effCR };
  }

  // --------- Update Geom Display ---------
  useEffect(() => {
    const geom = computeEngineGeometry();
    setGeomDisplay({
      cid: geom.cid > 0 ? geom.cid.toFixed(1) : '-',
      crStatic: geom.crStatic > 0 ? geom.crStatic.toFixed(2) : '-',
    });
  }, [engine]);

  // --------- Update Dynamic CR Display ---------
  useEffect(() => {
    const crData = calculateDynamicAndStaticCR();
    setDynCrDisplay(crData.crDynamic > 0 ? crData.crDynamic.toFixed(2) : '-');
  }, [engine, cam]);

  // --------- Run Calculation ---------
  function handleRunCalc() {
    try {
      const geom = computeEngineGeometry();
      console.log('geom:', geom);
      
      const crData = calculateDynamicAndStaticCR();
      console.log('crData:', crData);
      
      const engFull = { ...geom, rod: engine.rod, stroke: engine.stroke, cyl: engine.cyl, portCfm: engine.portCfm };
      console.log('engFull:', engFull);
      
      const currentCam = {
        ...cam,
        intLift: typeof effectiveIntLift === 'number' ? effectiveIntLift : cam.intLift,
        exhLift: typeof effectiveExhLift === 'number' ? effectiveExhLift : cam.exhLift,
      };
      console.log('currentCam:', currentCam);
      
      const tuneFull: Tune = {
        intake: tune.intake,
        fuel: tune.fuel,
        boostPsi: tune.boostPsi || 0,
        afr: tune.afr || 12.8,
        rpmStart: tune.graphRpmStart || 2000,
        rpmEnd: tune.graphRpmEnd || 7000,
        rpmStep: 250,
        intercoolerEff: tune.intercoolerEff || 0.7,
        compressorEff: tune.compressorEff || 0.72,
        turboOrBlower: tune.turboOrBlower || 'turbo',
      };
      console.log('tuneFull:', tuneFull);

      const hpData = estimateNaHp(engFull, currentCam, tuneFull);
      console.log('hpData returned:', hpData);
      
      if (!hpData || hpData.hp === undefined) {
        console.error('hpData is invalid:', hpData);
        setResults(null);
        setChartData([]);
        return;
      }

      const dynCR = crData.crDynamic;
      const curveData = buildCurve(engFull, currentCam, tuneFull, dynCR, hpData);
      console.log('curveData:', { points: curveData.points.length, effCR: curveData.effCR });

      setChartData(curveData.points);
      console.log('chartData state being set with', curveData.points.length, 'points');
      setResults({
        hp: hpData.hp,
        hpRpm: hpData.hpRpm,
        tq: hpData.tqAtHp,
        staticCR: crData.crStatic,
        dynCR: dynCR,
        effCR: curveData.effCR,
      });
      console.log('Results set successfully with hp:', hpData.hp);
    } catch (err) {
      console.error('Calculator error:', err);
      setResults(null);
      setChartData([]);
    }
  }

  // Recalculate when engine, cam, tune, or library changes
  useEffect(() => {
    handleRunCalc();
  }, [engine, cam, tune, catalogRockerRatio, userRockerRatio]);

  // Initial calculation on mount
  useEffect(() => {
    handleRunCalc();
  }, []);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#f5f5f5' }}>
      <section style={{ borderRadius: '18px', padding: '18px', background: 'radial-gradient(circle at top left, #ff2bd6 0%, #00d4ff 35%, #050816 75%, #020617 100%)', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(0,212,255,0.45)' }}>
        <p style={{ fontSize: '11px', color: '#c7d2fe', textAlign: 'center', margin: '0 0 12px 0' }}>
          Step 1: Geometry • Step 2: Catalog • Step 3: Cam Spec • Step 4: Intake/Fuel/Boost → Dyno curve. Estimations only; real-world dyno wins.
        </p>

        {/* STEP TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', justifyContent: 'center' }}>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,43,214,0.18)', border: '1px solid rgba(255,43,214,0.75)', color: '#ffd6f5' }}>1 • Engine</div>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.35)', color: '#c7f7ff' }}>2 • Catalog</div>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(124,255,203,0.10)', border: '1px solid rgba(124,255,203,0.35)', color: '#d7fff0' }}>3 • Cam Spec</div>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.25)', color: '#e5e7eb' }}>4 • Tune</div>

        <div style={{ marginTop: '8px', marginBottom: '10px', padding: '8px 10px', borderRadius: '12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(0,212,255,0.22)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <strong style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c7f7ff' }}>Rocker Ratio Adjustment</strong>
            <button
              type="button"
              onClick={syncUserRockerToCatalog}
              style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(0,212,255,0.35)', background: 'transparent', color: '#c7f7ff', cursor: 'pointer' }}
            >
              Match Catalog
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Catalog / Published Ratio</label>
              <input
                type="number"
                value={catalogRockerInput}
                onChange={(e) => {
                  setCatalogRockerInput(e.target.value);
                  if (!userRockerDirtyRef.current) {
                    setUserRockerInput(e.target.value);
                  }
                }}
                min="1"
                max="2.5"
                step="0.01"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Your Rocker Ratio</label>
              <input
                type="number"
                value={userRockerInput}
                onChange={(e) => {
                  setUserRockerInput(e.target.value);
                  setUserRockerDirty(true);
                }}
                min="1"
                max="2.5"
                step="0.01"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div style={{ background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(0,212,255,0.30)', borderRadius: '10px', padding: '8px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7dd3fc', marginBottom: '4px' }}>Net Valve Lift</div>
              <div style={{ fontSize: '12px', color: '#e5e7eb' }}>
                <div>Intake: {formatLiftDisplay(effectiveIntLift ?? cam.intLift)}"</div>
                <div>Exhaust: {formatLiftDisplay(effectiveExhLift ?? cam.exhLift)}"</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
            We convert the published cam lift (based on the catalog ratio) to your rocker ratio before sampling head flow or horsepower.
          </div>
        </div>
        </div>

        {/* STEP 1: SHORT BLOCK OR ENGINE GEOMETRY */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(0,212,255,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flex: 1 }}>
              <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>
                Step 1 • {shortBlocks.length > 0 ? 'Select Short Block' : 'Engine Geometry'}
              </h3>
              <span style={{ fontSize: '10px', color: '#a5b4fc' }}>
                {shortBlocks.length > 0 ? 'Load engine specs' : 'Bore • Stroke • Rod • Volumes'}
              </span>
            </div>
            
            {/* Unit Toggle Slider - only show if not using short blocks */}
            {shortBlocks.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '10px', color: unitSystem === 'imperial' ? '#00d4ff' : '#7CFFCB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '50px', textAlign: 'center' }}>
                {unitSystem === 'imperial' ? 'Imperial' : 'Metric'}
              </span>
              <button
                onClick={toggleUnitSystem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '70px',
                  height: '28px',
                  borderRadius: '999px',
                  border: 'none',
                  background: unitSystem === 'imperial' ? 'rgba(0,212,255,0.3)' : 'rgba(124,255,203,0.3)',
                  cursor: 'pointer',
                  padding: '2px',
                  position: 'relative',
                  transition: 'background-color 0.3s ease',
                }}
              >
                {/* Slider dot */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '999px',
                    background: unitSystem === 'imperial' ? '#00d4ff' : '#7CFFCB',
                    position: 'absolute',
                    left: unitSystem === 'imperial' ? '2px' : '44px',
                    transition: 'left 0.3s ease, background-color 0.3s ease',
                    boxShadow: `0 0 8px ${unitSystem === 'imperial' ? 'rgba(0,212,255,0.6)' : 'rgba(124,255,203,0.6)'}`,
                  }}
                />
                {/* Labels */}
                <span style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-between', paddingLeft: '6px', paddingRight: '6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', zIndex: 1, pointerEvents: 'none' }}>
                  <span style={{ flex: 1, textAlign: 'center', color: 'transparent' }}>I</span>
                  <span style={{ flex: 1, textAlign: 'center', color: 'transparent' }}>M</span>
                </span>
              </button>
            </div>
            )}
          </div>

          {/* SHORT BLOCK SELECTOR */}
          {shortBlocks.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '6px', fontSize: '11px', fontWeight: 600 }}>Select Short Block</label>
              <select
                value={selectedShortBlockId}
                onChange={(e) => {
                  setSelectedShortBlockId(e.target.value);
                  const block = shortBlocks.find(b => b.id === e.target.value);
                  if (block) {
                    setEngine({
                      bore: parseFloat(block.bore || '4.0'),
                      stroke: parseFloat(block.stroke || '3.5'),
                      rod: parseFloat(block.rod_length || '5.956'),
                      cyl: parseInt(String(block.cyl || 8), 10),
                      chamber: 56,
                      pistonCc: parseFloat(block.piston_dome_dish || '19.5'),
                      gasketBore: parseFloat(block.head_gasket_bore || '4.06'),
                      gasketThk: parseFloat(block.head_gasket_compressed_thickness || '0.04'),
                      deck: parseFloat(block.deck_height || '0.015'),
                      portCfm: 300,
                    });
                  }
                }}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              >
                <option value="">Choose a short block...</option>
                {shortBlocks.map(block => (
                  <option key={block.id} value={block.id}>{block.block_name}</option>
                ))}
              </select>
              {selectedShortBlockId && (
                <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,43,214,0.30)', fontSize: '11px', color: '#e5e7eb' }}>
                  Displacement: {geomDisplay.cid} CID • Static CR: {geomDisplay.crStatic} : 1
                </div>
              )}
            </div>
          )}

          {/* ENGINE GEOMETRY INPUTS - only show if not using short blocks */}
          {shortBlocks.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '12px' }}>
            {[
              { key: 'bore', label: unitSystem === 'imperial' ? 'Bore (in)' : 'Bore (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? 2 : 50, max: unitSystem === 'imperial' ? 6 : 152 },
              { key: 'stroke', label: unitSystem === 'imperial' ? 'Stroke (in)' : 'Stroke (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? 2 : 50, max: unitSystem === 'imperial' ? 6 : 152 },
              { key: 'rod', label: unitSystem === 'imperial' ? 'Rod Length (in)' : 'Rod Length (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? 4.5 : 114, max: unitSystem === 'imperial' ? 7.5 : 190 },
              { key: 'cyl', label: 'Cylinders', step: 1, min: 3, max: 16 },
              { key: 'chamber', label: 'Chamber Volume (cc)', step: 0.1, min: 30, max: 120 },
              { key: 'pistonCc', label: 'Piston Dome/Dish (cc)', step: 0.1, min: -40, max: 40 },
              { key: 'gasketBore', label: unitSystem === 'imperial' ? 'Gasket Bore (in)' : 'Gasket Bore (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? 2 : 50, max: unitSystem === 'imperial' ? 6 : 152 },
              { key: 'gasketThk', label: unitSystem === 'imperial' ? 'Gasket Thickness (in)' : 'Gasket Thickness (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? 0.01 : 0.25, max: unitSystem === 'imperial' ? 0.2 : 5 },
              { key: 'deck', label: unitSystem === 'imperial' ? 'Deck Clearance (in)' : 'Deck Clearance (mm)', step: unitSystem === 'imperial' ? 0.001 : 0.1, min: unitSystem === 'imperial' ? -0.05 : -1.27, max: unitSystem === 'imperial' ? 0.2 : 5 },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>{field.label}</label>
                {field.key === 'pistonCc' ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      inputMode="text"
                      pattern="-?[0-9]*\.?[0-9]*"
                      value={engine.pistonCc}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow typing minus, empty, or valid numbers
                        if (val === '' || val === '-' || val === '.' || val === '-.') {
                          setEngine({ ...engine, pistonCc: val as unknown as number });
                        } else {
                          const num = parseFloat(val);
                          if (!isNaN(num)) {
                            setEngine({ ...engine, pistonCc: num });
                          }
                        }
                      }}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = typeof engine.pistonCc === 'number' ? engine.pistonCc : parseFloat(String(engine.pistonCc)) || 0;
                        setEngine({ ...engine, pistonCc: -current });
                      }}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(255,43,214,0.15)', color: '#f9fafb', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      title="Toggle +/- (Dome/Dish)"
                    >
                      ±
                    </button>
                  </div>
                ) : (
                <input
                  type="number"
                  value={engine[field.key as keyof typeof engine]}
                  onChange={(e) => setEngine({ ...engine, [field.key]: parseFloat(e.target.value) || 0 })}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
                />
                )}
              </div>
            ))}
          </div>
          )}

          {shortBlocks.length === 0 && (
          <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,43,214,0.30)', fontSize: '11px', color: '#e5e7eb' }}>
            Displacement: {geomDisplay.cid} CID • Static CR: {geomDisplay.crStatic} : 1
          </div>
          )}
        </div>

        {/* STEP 2: ATTACHED HEAD OR CATALOG SELECTION */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(0,212,255,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>
              Step 2 • {shortBlocks.length > 0 && selectedShortBlockId ? 'Cylinder Head' : 'Catalog Selection'}
            </h3>
            <span style={{ fontSize: '10px', color: '#a5b4fc' }}>
              {shortBlocks.length > 0 && selectedShortBlockId ? 'From short block' : 'Make → Family → Cam → Head'}
            </span>
          </div>

          {/* ATTACHED HEAD FROM SHORT BLOCK - DISPLAY ONLY */}
          {shortBlocks.length > 0 && selectedShortBlockId && (
            (() => {
              const block = shortBlocks.find(b => b.id === selectedShortBlockId);
              const attachedHeadId = block?.attachedHead?.id;
              const selected = headOptions.find(h => h.id === selectedHead);
              const isAttached = attachedHeadId && selectedHead === attachedHeadId;
              return (
                <div style={{ padding: '8px 10px', borderRadius: '8px', background: isAttached ? 'rgba(124,255,203,0.08)' : 'rgba(255,43,214,0.08)', border: isAttached ? '1px solid rgba(124,255,203,0.25)' : '1px solid rgba(255,43,214,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#f9fafb', fontSize: '12px', fontWeight: 500 }}>
                        {selected?.label || 'No head attached'}
                        {isAttached && <span style={{ color: '#7CFFCB', marginLeft: 8, fontSize: 10 }}>(From short block)</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '10px', color: '#a5b4fc' }}>
                      <div>Chamber: {selected?.chamberCc ?? '-' } cc</div>
                      {/* Optionally, show more info if available */}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* FULL CATALOG SELECTION - ONLY WHEN NOT USING SHORT BLOCKS */}
          {shortBlocks.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Engine Make</label>
              <select
                value={selectedMakeId}
                onChange={(e) => handleMakeChange(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              >
                {ENGINE_SELECTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Engine Family</label>
              <select
                value={selectedFamilyId}
                onChange={(e) => handleFamilyChange(e.target.value)}
                disabled={!availableFamilies.length}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none', opacity: availableFamilies.length ? 1 : 0.5, cursor: availableFamilies.length ? 'pointer' : 'not-allowed' }}
              >
                {availableFamilies.map((spec) => (
                  <option key={spec.id} value={spec.id}>{getFamilyLabel(spec)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Cam Selection</label>
              <select
                value={selectedCatalogCam}
                onChange={(e) => setSelectedCatalogCam(e.target.value)}
                disabled={camLoading || camOptions.length === 0}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none', opacity: camLoading || camOptions.length === 0 ? 0.5 : 1, cursor: camLoading || camOptions.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <option value="">{camLoading ? 'Loading cam library…' : 'Select Cam...'}</option>
                {camOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Cylinder Head</label>
              <select
                value={selectedHead}
                onChange={(e) => setSelectedHead(e.target.value)}
                disabled={headLoading || headOptions.length === 0}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none', opacity: headLoading || headOptions.length === 0 ? 0.5 : 1, cursor: headLoading || headOptions.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <option value="">{headLoading ? 'Loading head library…' : 'Select Head...'}</option>
                {headOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              {headError && <div style={{ color: '#fb7185', fontSize: '10px', marginTop: '2px' }}>{headError}</div>}
            </div>
          </div>
          )}

          <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,43,214,0.30)', fontSize: '11px', color: '#e5e7eb', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span>Dynamic CR (est): {dynCrDisplay} : 1</span>
            <span>Head Flow Applied: {engine.portCfm.toFixed(0)} cfm @28"</span>
            {selectedCatalogCam && camOptions.find(c => c.id === selectedCatalogCam) && (
              <span>Catalog Cam: {camOptions.find(c => c.id === selectedCatalogCam)?.label}</span>
            )}
          </div>
        </div>

        {/* STEP 3: CAMSHAFT SELECTION OR CAM SPECIFICATIONS */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(255,43,214,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>
              Step 3 • {shortBlocks.length > 0 && selectedShortBlockId ? 'Camshaft Selection' : 'Cam Specifications'}
            </h3>
            <span style={{ fontSize: '10px', color: '#a5b4fc' }}>
              {shortBlocks.length > 0 && selectedShortBlockId ? 'Choose from catalog' : 'Auto-filled from catalog — tweak as needed'}
            </span>
          </div>

          {/* SIMPLE CAM SELECTION - WHEN USING SHORT BLOCKS */}
          {shortBlocks.length > 0 && selectedShortBlockId && (() => {
            // Only show camshafts attached to the selected short block
            const block = shortBlocks.find(b => b.id === selectedShortBlockId);
            const attachedCams = Array.isArray(block?.attachedCams) ? block.attachedCams : [];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>Camshaft</label>
                  <select
                    value={selectedCatalogCam}
                    onChange={(e) => setSelectedCatalogCam(e.target.value)}
                    disabled={attachedCams.length === 0}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none', opacity: attachedCams.length === 0 ? 0.5 : 1, cursor: attachedCams.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="">{attachedCams.length === 0 ? 'No camshafts attached' : 'Select Camshaft...'}</option>
                    {attachedCams.map((option: any) => (
                      <option key={option.id} value={option.id}>{option.label || option.name || option.part_number || 'Camshaft'}</option>
                    ))}
                  </select>
                </div>
                {selectedCatalogCam && (
                  <div style={{ padding: '6px 8px', borderRadius: '8px', background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,43,214,0.30)', fontSize: '11px', color: '#e5e7eb' }}>
                    <div>Selected: {attachedCams.find((c: any) => c.id === selectedCatalogCam)?.label || attachedCams.find((c: any) => c.id === selectedCatalogCam)?.name}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* FULL CAM SPECIFICATIONS - ONLY WHEN NOT USING SHORT BLOCKS */}
          {shortBlocks.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
            {CAM_FIELD_CONFIG.map((field) => {
              const numericProps = field.type === 'number'
                ? { step: field.step, min: field.min, max: field.max }
                : {};

              return (
                <div key={field.key}>
                  <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={getCamFieldDisplayValue(field)}
                    onChange={(e) => handleCamFieldChange(field, e.target.value)}
                    onBlur={() => handleCamFieldBlur(field)}
                    {...numericProps}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* STEP 4: TUNE / INTAKE / FUEL / BOOST */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(124,255,203,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>Step 4 • Intake, Fuel & Boost</h3>
            <span style={{ fontSize: '10px', color: '#a5b4fc' }}>Tune layer • Dyno RPM range</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Intake Type</label>
              <select
                value={tune.intake}
                onChange={(e) => setTune({ ...tune, intake: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              >
                <option value="dual_plane">Dual Plane NA</option>
                <option value="single_plane">Single Plane NA</option>
                <option value="tunnel_ram">Tunnel Ram NA</option>
                <option value="boosted">Boosted (Turbo/SC)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Fuel</label>
              <select
                value={tune.fuel}
                onChange={(e) => setTune({ ...tune, fuel: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              >
                <option value="pump91">Pump 91</option>
                <option value="pump93">Pump 93</option>
                <option value="race_gas">Race Gas</option>
                <option value="e85">E85</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Boost (psi)</label>
              <input
                type="number"
                value={isNaN(tune.boostPsi) ? 0 : tune.boostPsi}
                onChange={(e) => setTune({ ...tune, boostPsi: parseFloat(e.target.value) || 0 })}
                min="0" max="40" step="1"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Target AFR (WOT)</label>
              <input
                type="number"
                value={tune.afr}
                onChange={(e) => setTune({ ...tune, afr: parseFloat(e.target.value) })}
                min="9" max="13" step="0.1"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Intercooler Eff (0-1)</label>
              <input
                type="number"
                value={tune.intercoolerEff}
                onChange={(e) => setTune({ ...tune, intercoolerEff: parseFloat(e.target.value) })}
                min="0" max="1" step="0.05"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Compressor Eff (0.4-0.85)</label>
              <input
                type="number"
                value={tune.compressorEff}
                onChange={(e) => setTune({ ...tune, compressorEff: parseFloat(e.target.value) })}
                min="0.4" max="0.85" step="0.01"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Turbo or Blower</label>
              <select
                value={tune.turboOrBlower}
                onChange={(e) => setTune({ ...tune, turboOrBlower: e.target.value })}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              >
                <option value="turbo">Turbo</option>
                <option value="blower">Blower</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Graph RPM Start</label>
              <input
                type="number"
                value={tune.graphRpmStart}
                onChange={(e) => setTune({ ...tune, graphRpmStart: parseFloat(e.target.value) })}
                min="1000" max="9000" step="250"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>Graph RPM End</label>
              <input
                type="number"
                value={tune.graphRpmEnd}
                onChange={(e) => setTune({ ...tune, graphRpmEnd: parseFloat(e.target.value) })}
                min="2000" max="10000" step="250"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              onClick={handleRunCalc}
              style={{ padding: '7px 20px', borderRadius: '999px', border: '0', background: 'linear-gradient(135deg, #ff2bd6, #00d4ff, #7CFFCB)', color: '#020617', fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Run Cam Spec Elite
            </button>
          </div>
        </div>

        {/* RESULTS */}
        {results && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ flex: '1 1 260px', maxWidth: '460px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(0,212,255,0.30)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', marginBottom: '4px' }}>
                  Peak Output
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e5e7eb' }}>
                  {results.hp.toFixed(1)} hp @ {results.hpRpm.toFixed(0)} rpm • {results.tq.toFixed(1)} ft-lb
                </div>
                <div style={{ marginTop: '8px', position: 'relative', height: '16px', borderRadius: '999px', background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div
                    style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: ((results.hp / Math.max(results.hp, results.tq)) * 100).toFixed(1) + '%', background: 'linear-gradient(90deg, #ff2bd6, #00d4ff)', opacity: 0.9 }}
                  />
                  <div
                    style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: ((results.tq / Math.max(results.hp, results.tq)) * 100).toFixed(1) + '%', background: 'linear-gradient(90deg, #7CFFCB, #00d4ff)', opacity: 0.7 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px' }}>
                  <span style={{ color: '#ff2bd6' }}>HP bar (relative)</span>
                  <span style={{ color: '#7CFFCB' }}>TQ bar (relative)</span>
                </div>
              </div>

              <div style={{ minWidth: '160px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(255,43,214,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc' }}>Compression Ratios</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#e5e7eb', marginTop: '2px' }}>
                  {results.staticCR.toFixed(2)} / {results.dynCR.toFixed(2)} / {results.effCR.toFixed(2)}
                </div>
                <div style={{ fontSize: '10px', color: '#a5b4fc', marginTop: '2px' }}>
                  Static / Dynamic / Effective (boosted)
                </div>
              </div>
            </div>

            {/* CHART - SVG DYNO GRAPH */}
            <div style={{ borderRadius: '12px', padding: '10px', background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(0,212,255,0.18)' }}>
              {chartData && chartData.length > 0 ? (
                (() => {
                  const svgWidth = 700;
                  const svgHeight = 320;
                  const padding = 60;
                  const graphWidth = svgWidth - 2 * padding;
                  const graphHeight = svgHeight - 2 * padding;

                  const minRpm = Math.min(...chartData.map(p => p.rpm));
                  const maxRpm = Math.max(...chartData.map(p => p.rpm));
                  const maxHp = Math.max(...chartData.map(p => p.hp)) * 1.1;

                  // Build SVG path for HP curve
                  const hpPath = [];
                  for (let i = 0; i < chartData.length; i++) {
                    const point = chartData[i];
                    const x = padding + ((point.rpm - minRpm) / (maxRpm - minRpm)) * graphWidth;
                    const y = padding + graphHeight - (point.hp / maxHp) * graphHeight;
                    
                    if (i === 0) {
                      hpPath.push(`M ${x} ${y}`);
                    } else {
                      hpPath.push(`L ${x} ${y}`);
                    }
                  }

                  const hoverPoint = hoverIdx !== null ? chartData[hoverIdx] : null;

                  return (
                    <div style={{ position: 'relative' }}>
                      <svg 
                        width={svgWidth} 
                        height={svgHeight} 
                        style={{ marginTop: 12, border: '1px solid rgba(0,212,255,0.35)', borderRadius: 8, cursor: 'crosshair' }}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const graphX = x - padding;
                          if (graphX >= 0 && graphX <= graphWidth) {
                            const rpmPos = minRpm + (graphX / graphWidth) * (maxRpm - minRpm);
                            const closest = chartData.reduce((prev, curr, idx) => 
                              Math.abs(curr.rpm - rpmPos) < Math.abs(chartData[prev].rpm - rpmPos) ? idx : prev
                            , 0);
                            setHoverIdx(closest);
                          }
                        }}
                        onMouseLeave={() => setHoverIdx(null)}
                      >
                        {/* Grid */}
                        <defs>
                          <pattern id="dyno-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d={`M 60 0 L 0 0 0 60`} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect x={padding} y={padding} width={graphWidth} height={graphHeight} fill="url(#dyno-grid)" />

                        {/* Axes */}
                        <line x1={padding} y1={padding + graphHeight} x2={padding + graphWidth} y2={padding + graphHeight} stroke="#00d4ff" strokeWidth="2" />
                        <line x1={padding} y1={padding} x2={padding} y2={padding + graphHeight} stroke="#00d4ff" strokeWidth="2" />

                        {/* RPM Labels (X-axis) */}
                        {[2000, 3000, 4000, 5000, 6000, 7000, 8000].map((rpmVal) => {
                          if (rpmVal < minRpm || rpmVal > maxRpm) return null;
                          const x = padding + ((rpmVal - minRpm) / (maxRpm - minRpm)) * graphWidth;
                          return (
                            <g key={`rpm-${rpmVal}`}>
                              <line x1={x} y1={padding + graphHeight} x2={x} y2={padding + graphHeight + 4} stroke="#00d4ff" strokeWidth="1" />
                              <text x={x} y={padding + graphHeight + 18} textAnchor="middle" fontSize="11" fill="#a5b4fc">
                                {rpmVal / 1000}k
                              </text>
                            </g>
                          );
                        })}

                        {/* HP Labels (Y-axis) */}
                        {[0, 100, 200, 300, 400, 500].map((hpVal) => {
                          if (hpVal > maxHp) return null;
                          const y = padding + graphHeight - (hpVal / maxHp) * graphHeight;
                          return (
                            <g key={`hp-${hpVal}`}>
                              <line x1={padding - 4} y1={y} x2={padding} y2={y} stroke="#00d4ff" strokeWidth="1" />
                              <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#a5b4fc">
                                {hpVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* HP Curve */}
                        <path d={hpPath.join(" ")} fill="none" stroke="#00d4ff" strokeWidth="3" />

                        {/* Peak HP marker */}
                        {results && (
                          <>
                            <circle 
                              cx={padding + ((results.hpRpm - minRpm) / (maxRpm - minRpm)) * graphWidth} 
                              cy={padding + graphHeight - (results.hp / maxHp) * graphHeight} 
                              r="5" 
                              fill="#ff2bd6" 
                              stroke="#7CFFCB" 
                              strokeWidth="2"
                            />
                          </>
                        )}

                        {/* Hover vertical line and point */}
                        {hoverPoint && (
                          <>
                            <line 
                              x1={padding + ((hoverPoint.rpm - minRpm) / (maxRpm - minRpm)) * graphWidth}
                              y1={padding}
                              x2={padding + ((hoverPoint.rpm - minRpm) / (maxRpm - minRpm)) * graphWidth}
                              y2={padding + graphHeight}
                              stroke="rgba(0,212,255,0.3)"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                            <circle 
                              cx={padding + ((hoverPoint.rpm - minRpm) / (maxRpm - minRpm)) * graphWidth}
                              cy={padding + graphHeight - (hoverPoint.hp / maxHp) * graphHeight}
                              r="4"
                              fill="rgba(0,212,255,0.7)"
                            />
                          </>
                        )}

                        {/* Axis Labels */}
                        <text x={padding + graphWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="12" fill="#a5b4fc">
                          RPM
                        </text>
                        <text x={20} y={padding + graphHeight / 2} textAnchor="middle" fontSize="12" fill="#a5b4fc" transform={`rotate(-90, 20, ${padding + graphHeight / 2})`}>
                          Horsepower (hp)
                        </text>
                      </svg>

                      {/* Hover Tooltip */}
                      {hoverPoint && (
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          background: 'rgba(2,6,23,0.95)',
                          border: '1px solid rgba(0,212,255,0.6)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#e5e7eb',
                          pointerEvents: 'none',
                          fontFamily: 'monospace'
                        }}>
                          <div style={{ color: '#a5b4fc', marginBottom: '4px' }}>RPM: {hoverPoint.rpm.toFixed(0)}</div>
                          <div style={{ color: '#00d4ff', fontWeight: 'bold' }}>HP: {hoverPoint.hp.toFixed(1)}</div>
                          <div style={{ color: '#7CFFCB', marginTop: '4px', fontSize: '10px' }}>TQ: {hoverPoint.tq.toFixed(1)} ft-lb</div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#a5b4fc', fontSize: '12px' }}>
                  Click "Run Cam Spec Elite" to generate dyno curve
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

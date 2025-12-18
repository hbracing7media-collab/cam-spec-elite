'use client';

import React, { useState, useEffect, useRef } from 'react';

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

export default function CamSpecEliteCalculator() {
  const [engine, setEngine] = useState({
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
  });

  const [cam, setCam] = useState({
    name: 'F303+',
    intDur: 226,
    exhDur: 234,
    lsa: 114,
    ivc: 43,
    intLift: 0.585,
    exhLift: 0.574,
    rpmStart: 3000,
    rpmEnd: 6500,
  });

  const [tune, setTune] = useState({
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
  });

  const [camLibrary, setCamLibrary] = useState<Cam[]>([]);
  const [selectedCamIdx, setSelectedCamIdx] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [chartData, setChartData] = useState<CurvePoint[]>([]);
  const [geomDisplay, setGeomDisplay] = useState({ cid: '-', crStatic: '-' });
  const [dynCrDisplay, setDynCrDisplay] = useState('-');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');

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

  // --------- Add Cam to Library ---------
  function handleAddCam() {
    setCamLibrary([...camLibrary, cam]);
  }

  // --------- Run Calculation ---------
  function handleRunCalc() {
    try {
      const geom = computeEngineGeometry();
      console.log('geom:', geom);
      
      const crData = calculateDynamicAndStaticCR();
      console.log('crData:', crData);
      
      const engFull = { ...geom, rod: engine.rod, stroke: engine.stroke, cyl: engine.cyl, portCfm: engine.portCfm };
      console.log('engFull:', engFull);
      
      const currentCam = selectedCamIdx !== '' ? camLibrary[Number(selectedCamIdx)] : cam;
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
  }, [engine, cam, tune, camLibrary, selectedCamIdx]);

  // Initial calculation on mount
  useEffect(() => {
    handleRunCalc();
  }, []);

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#f5f5f5' }}>
      <section style={{ borderRadius: '18px', padding: '18px', background: 'radial-gradient(circle at top left, #ff2bd6 0%, #00d4ff 35%, #050816 75%, #020617 100%)', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', border: '1px solid rgba(0,212,255,0.45)' }}>
        <p style={{ fontSize: '11px', color: '#c7d2fe', textAlign: 'center', margin: '0 0 12px 0' }}>
          Step 1: Engine • Step 2: Cam • Step 3: Intake/Fuel/Boost → Dyno curve. Estimations only; real-world dyno wins.
        </p>

        {/* STEP TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', justifyContent: 'center' }}>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,43,214,0.18)', border: '1px solid rgba(255,43,214,0.75)', color: '#ffd6f5' }}>1 • Engine</div>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.35)', color: '#c7f7ff' }}>2 • Cam</div>
          <div style={{ padding: '4px 10px', borderRadius: '999px', background: 'rgba(124,255,203,0.10)', border: '1px solid rgba(124,255,203,0.35)', color: '#d7fff0' }}>3 • Tune</div>
        </div>

        {/* STEP 1: ENGINE GEOMETRY */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(0,212,255,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flex: 1 }}>
              <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>Step 1 • Engine Geometry</h3>
              <span style={{ fontSize: '10px', color: '#a5b4fc' }}>Bore • Stroke • Rod • Volumes • Port Flow</span>
            </div>
            
            {/* Unit Toggle Slider */}
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
          </div>

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
              { key: 'portCfm', label: 'Port Flow (cfm @28" per cyl)', step: 1, min: 100, max: 450 },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '2px', fontSize: '11px' }}>{field.label}</label>
                <input
                  type="number"
                  value={engine[field.key as keyof typeof engine]}
                  onChange={(e) => setEngine({ ...engine, [field.key]: parseFloat(e.target.value) || 0 })}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(255,43,214,0.30)', fontSize: '11px', color: '#e5e7eb' }}>
            Displacement: {geomDisplay.cid} CID • Static CR: {geomDisplay.crStatic} : 1
          </div>
        </div>

        {/* STEP 2: CAM LIBRARY */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(255,43,214,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>Step 2 • Cam Library</h3>
            <span style={{ fontSize: '10px', color: '#a5b4fc' }}>Build & select cam</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
            {[
              { key: 'name', label: 'Cam Name', type: 'text' },
              { key: 'intDur', label: 'Int Dur @ .050 (°)', type: 'number', min: 180, max: 290, step: 1 },
              { key: 'exhDur', label: 'Exh Dur @ .050 (°)', type: 'number', min: 180, max: 300, step: 1 },
              { key: 'lsa', label: 'LSA (°)', type: 'number', min: 104, max: 118, step: 1 },
              { key: 'ivc', label: 'IVC @ .050 (ABDC °)', type: 'number', min: 40, max: 90, step: 1 },
              { key: 'intLift', label: 'Int Lift (in)', type: 'number', min: 0.35, max: 0.9, step: 0.001 },
              { key: 'exhLift', label: 'Exh Lift (in)', type: 'number', min: 0.35, max: 0.9, step: 0.001 },
              { key: 'rpmStart', label: 'Cam RPM Start', type: 'number', min: 1000, max: 8000, step: 100 },
              { key: 'rpmEnd', label: 'Cam RPM End', type: 'number', min: 2000, max: 10000, step: 100 },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', color: '#ffd6f5', marginBottom: '2px', fontSize: '11px' }}>{field.label}</label>
                <input
                  type={field.type}
                  value={cam[field.key as keyof typeof cam]}
                  onChange={(e) => setCam({ ...cam, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,43,214,0.35)', background: 'rgba(2,6,23,0.9)', color: '#f9fafb', fontSize: '12px', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleAddCam}
                style={{ padding: '6px 10px', borderRadius: '999px', border: '0', background: 'linear-gradient(135deg, #7CFFCB, #00d4ff)', color: '#020617', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Save Cam
              </button>
              <span style={{ fontSize: '11px', color: '#a5b4fc' }}>Cam Library:</span>
              <select
                value={selectedCamIdx}
                onChange={(e) => setSelectedCamIdx(e.target.value)}
                style={{ minWidth: '160px', padding: '4px 8px', borderRadius: '999px', border: '1px solid rgba(0,212,255,0.45)', background: 'rgba(2,6,23,0.9)', color: '#e5e7eb', fontSize: '11px', outline: 'none' }}
              >
                <option value="">(Current Unsaved Cam)</option>
                {camLibrary.map((c, idx) => (
                  <option key={idx} value={String(idx)}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '11px', color: '#7CFFCB' }}>
              Dynamic CR (est): {dynCrDisplay} : 1
            </div>
          </div>
        </div>

        {/* STEP 3: TUNE / INTAKE / FUEL / BOOST */}
        <div style={{ borderRadius: '12px', padding: '10px 12px', background: 'rgba(6,11,30,0.78)', border: '1px solid rgba(124,255,203,0.22)', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>Step 3 • Intake, Fuel & Boost</h3>
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

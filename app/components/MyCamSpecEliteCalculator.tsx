'use client';

import React, { useState, useEffect } from 'react';

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
}

interface Cam {
  id: string;
  brand?: string;
  cam_name?: string;
  part_number?: string;
  intDur?: number;
  exhDur?: number;
  lsa?: number;
  ivc?: number;
  intLift?: number;
  exhLift?: number;
}

interface Head {
  id: string;
  brand?: string;
  part_number?: string;
  intake_valve_size?: string;
  exhaust_valve_size?: string;
  chamber_cc?: number;
  intake_runner_cc?: number;
}

interface CurvePoint {
  rpm: number;
  hp: number;
  tq: number;
}

interface Tune {
  intake: string;
  fuel: string;
  boostPsi: number;
  afr: number;
  rpmStart: number;
  rpmEnd: number;
  rpmStep: number;
}

interface MyCamSpecEliteProps {
  shortBlocks: ShortBlock[];
  headBuilds: any[];
  camBuilds: any[];
}

export default function MyCamSpecEliteCalculator({ shortBlocks, headBuilds, camBuilds }: MyCamSpecEliteProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(shortBlocks[0]?.id || '');
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  const [tune, setTune] = useState<Tune>({
    intake: 'single_plane',
    fuel: 'pump93',
    boostPsi: 0,
    afr: 12.0,
    rpmStart: 2000,
    rpmEnd: 7000,
    rpmStep: 250,
  });
  const [results, setResults] = useState<any>(null);
  const [chartData, setChartData] = useState<CurvePoint[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const selectedBlock = shortBlocks.find((b) => b.id === selectedBlockId);
  const linkedHeadBuild = headBuilds.find((h) => h.short_block_id === selectedBlockId);
  const linkedCamBuild = camBuilds.find((c) => c.short_block_id === selectedBlockId);
  const linkedCams = linkedCamBuild ? [linkedCamBuild.cam1, linkedCamBuild.cam2, linkedCamBuild.cam3].filter(Boolean) : [];

  // Helper function to clamp values
  function clamp(x: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, x));
  }

  // Calculate peak HP
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
  ): number {
    const stg = Math.min(5, Math.max(1, Math.round(manifoldStage) || 1));
    const dur = Math.max(150, intakeDur050 || 0);
    const lift = Math.max(0.35, intakeLift || 0.5);
    const lsa = Math.max(104, Math.min(118, lsaAngle || 110));
    const dcr = Math.max(5.0, Math.min(11.0, dynamicCR || 8.5));
    const cid = Math.max(1, displacementCID || 350);
    const cyl = Math.max(4, cylinders || 8);
    const cfm = Math.max(50, peakIntakeFlowCFM || 300);

    const baseFactor = 0.305;
    const durationFactor = 1 + (dur - 240) / 500;
    const liftFactor = 1 + (lift - 0.5) / 0.5;
    const lsaFactor = 1 + (110 - lsa) / 100;
    const crFactor = 1 + (dcr - 8) / 10;
    const manifoldFactor = 0.8 + stg * 0.08;

    return baseFactor * (cid / 100) * cfm * durationFactor * liftFactor * lsaFactor * crFactor * manifoldFactor * (cyl / 8);
  }

  // Fuel factor
  function fuelFactor(fuel: string) {
    if (fuel === 'e85') return 1.07;
    if (fuel === 'race_gas') return 1.04;
    if (fuel === 'pump93') return 1.02;
    return 1.0;
  }

  // Intake factor
  function intakeFactor(intake: string) {
    if (intake === 'dual_plane') return 0.96;
    if (intake === 'single_plane') return 1.0;
    if (intake === 'tunnel_ram') return 1.05;
    if (intake === 'boosted') return 1.02;
    return 1.0;
  }

  // Run calculation
  function handleRunCalc() {
    if (!selectedBlock || !selectedCamId) return;

    try {
      const bore = parseFloat(selectedBlock.bore || '4.0');
      const stroke = parseFloat(selectedBlock.stroke || '3.5');
      const rod = parseFloat(selectedBlock.rod_length || '5.956');
      const cyl = parseInt(String(selectedBlock.cyl || 8), 10);
      const chamber = 56;
      const gasketBore = parseFloat(selectedBlock.head_gasket_bore || '4.06');
      const gasketThk = parseFloat(selectedBlock.head_gasket_compressed_thickness || '0.04');
      const deck = parseFloat(selectedBlock.deck_height || '0.015');
      const portCfm = 300;

      const selectedCam = linkedCams.find((c) => c?.id === selectedCamId);
      if (!selectedCam) {
        console.warn('Selected cam not found:', selectedCamId);
        return;
      }

      const intDur = parseFloat(String(selectedCam.duration_int_050 || 226));
      const intLift = parseFloat(String(selectedCam.lift_int || 0.585));
      const lsa = parseFloat(String(selectedCam.lsa || 114));
      const tappetType = 'solid';

    // Calculate static CR
    const cid = (Math.PI / 4) * Math.pow(bore, 2) * stroke * cyl;
    const chambervol = (chamber * cid) / 1000;
    const pistonCc = parseFloat(selectedBlock.piston_dome_dish || '19.5');
    const gasketVol = (Math.PI / 4) * Math.pow(gasketBore, 2) * gasketThk * cyl;
    const deckVol = (Math.PI / 4) * Math.pow(bore, 2) * deck * cyl;
    const totalDisplaced = cid + chambervol + gasketVol + deckVol - pistonCc;
    const crStatic = (cid + totalDisplaced) / totalDisplaced;

    // Calculate IVC and dynamic CR (simplified)
    const ivc = 43;
    const adiabatic = 1.4;
    const bdc = stroke / 2;
    const ivcMM = (ivc / 360) * stroke + bdc;
    const vesRatio = ivcMM / (stroke - ivcMM);
    const crDynamic = 1 + vesRatio * Math.pow(crStatic - 1, adiabatic);

    // Calculate peak HP
    const peakHp = calcPeakHpFromInputs(1, intDur, intLift, lsa, tappetType, crDynamic, cid, cyl, portCfm);

    // Generate torque curve
    const fuelMult = fuelFactor(tune.fuel);
    const intakeMult = intakeFactor(tune.intake);
    const boostMult = tune.boostPsi > 0 ? 1 + tune.boostPsi * 0.05 : 1;

    const newChartData: CurvePoint[] = [];
    for (let rpm = tune.rpmStart; rpm <= tune.rpmEnd; rpm += tune.rpmStep) {
      const rpmFactor = rpm / 5500;
      const hpAtRpm = peakHp * (1 + Math.sin((rpmFactor - 0.5) * Math.PI) * 0.3) * fuelMult * intakeMult * boostMult;
      const tqAtRpm = (hpAtRpm * 5252) / rpm;
      newChartData.push({ rpm, hp: Math.max(0, hpAtRpm), tq: Math.max(0, tqAtRpm) });
    }

    const peakRpm = tune.rpmStart + (tune.rpmEnd - tune.rpmStart) * 0.7;
    setResults({
      hp: peakHp * fuelMult * intakeMult * boostMult,
      hpRpm: peakRpm,
      tq: (peakHp * fuelMult * intakeMult * boostMult * 5252) / peakRpm,
      crStatic: crStatic.toFixed(2),
      crDynamic: crDynamic.toFixed(2),
    });
    setChartData(newChartData);
    } catch (err) {
      console.error('Error in calculator:', err);
      setResults(null);
    }
  }

  // Run calculation when block or cam changes
  useEffect(() => {
    if (selectedBlockId && selectedCamId) {
      handleRunCalc();
    }
  }, [selectedBlockId, selectedCamId, tune, camSpecs]);

  if (shortBlocks.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#a5b4fc', fontSize: 12 }}>
        <div>No short blocks available</div>
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px' }}>
          Create a short block first to use this calculator
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        padding: '12px',
        background: 'radial-gradient(circle at top left, rgba(255,43,214,0.1) 0%, rgba(0,212,255,0.05) 40%, rgba(2,6,23,0.9) 80%)',
        border: '1px solid rgba(0,212,255,0.25)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        My Cam Spec Elite
      </h3>

      {shortBlocks.length === 0 ? (
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,43,214,0.2)', fontSize: '11px', color: '#a5b4fc' }}>
          Create a short block first to use this calculator
        </div>
      ) : (
        <>
          {/* STEP 1: SHORT BLOCK SELECTION */}
          <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#7dd3fc', marginBottom: '4px' }}>
              Step 1: Select Short Block
            </label>
            <select
              value={selectedBlockId}
              onChange={(e) => {
                setSelectedBlockId(e.target.value);
                setSelectedCamId('');
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(56,189,248,0.3)',
            background: 'rgba(2,6,23,0.9)',
            color: '#e5e7eb',
            fontSize: '11px',
            outline: 'none',
          }}
        >
          {shortBlocks.map((block) => (
            <option key={block.id} value={block.id}>
              {block.block_name}
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: HEAD AUTO-FILL */}
      {selectedBlock && (
        <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#7dd3fc', marginBottom: '4px' }}>
            Step 2: Linked Head
          </label>
          <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.8)' }}>
            {linkedHeadBuild?.cylinder_heads ? (
              `${linkedHeadBuild.cylinder_heads.brand} ${linkedHeadBuild.cylinder_heads.part_number}`
            ) : (
              <span style={{ color: 'rgba(226,232,240,0.5)' }}>No head linked</span>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: CAM SELECTION OR NO CAMS MESSAGE */}
      {selectedBlock && linkedCams.length > 0 && (
        <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,43,214,0.2)' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#7dd3fc', marginBottom: '4px' }}>
            Step 3: Select Cam
          </label>
          <select
            value={selectedCamId}
            onChange={(e) => setSelectedCamId(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,43,214,0.3)',
              background: 'rgba(2,6,23,0.9)',
              color: '#e5e7eb',
              fontSize: '11px',
              outline: 'none',
            }}
          >
            <option value="">Select a cam...</option>
            {linkedCams.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.brand} {cam.cam_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedBlock && linkedCams.length === 0 && (
        <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,43,214,0.2)' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#7dd3fc', marginBottom: '4px' }}>
            Step 3: Linked Cams
          </label>
          <div style={{ fontSize: '10px', color: '#a5b4fc' }}>
            No cams linked to this short block. Create a cam build to add cams.
          </div>
        </div>
      )}

      {/* STEP 4: TUNE & FUEL */}
      {selectedCamId && (
        <div style={{ marginBottom: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(124,255,203,0.2)' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#7CFFCB', marginBottom: '6px' }}>
            Step 4: Tune & Fuel
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            <div>
              <label style={{ fontSize: '9px', color: '#a5b4fc' }}>Fuel</label>
              <select
                value={tune.fuel}
                onChange={(e) => setTune({ ...tune, fuel: e.target.value })}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(124,255,203,0.2)',
                  background: 'rgba(2,6,23,0.9)',
                  color: '#e5e7eb',
                  fontSize: '10px',
                  outline: 'none',
                }}
              >
                <option value="pump93">Pump 93</option>
                <option value="race_gas">Race Gas</option>
                <option value="e85">E85</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '9px', color: '#a5b4fc' }}>Intake</label>
              <select
                value={tune.intake}
                onChange={(e) => setTune({ ...tune, intake: e.target.value })}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(124,255,203,0.2)',
                  background: 'rgba(2,6,23,0.9)',
                  color: '#e5e7eb',
                  fontSize: '10px',
                  outline: 'none',
                }}
              >
                <option value="single_plane">Single Plane</option>
                <option value="dual_plane">Dual Plane</option>
                <option value="tunnel_ram">Tunnel Ram</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '9px', color: '#a5b4fc' }}>Boost PSI</label>
              <input
                type="number"
                value={tune.boostPsi}
                onChange={(e) => setTune({ ...tune, boostPsi: parseFloat(e.target.value) || 0 })}
                min="0"
                max="20"
                step="1"
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(124,255,203,0.2)',
                  background: 'rgba(2,6,23,0.9)',
                  color: '#e5e7eb',
                  fontSize: '10px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '9px', color: '#a5b4fc' }}>AFR</label>
              <input
                type="number"
                value={tune.afr}
                onChange={(e) => setTune({ ...tune, afr: parseFloat(e.target.value) || 12 })}
                min="10"
                max="16"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(124,255,203,0.2)',
                  background: 'rgba(2,6,23,0.9)',
                  color: '#e5e7eb',
                  fontSize: '10px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {results && (
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', fontSize: '11px' }}>
          <div style={{ fontWeight: 700, color: '#7dd3fc', marginBottom: '4px' }}>
            {results.hp.toFixed(1)} hp @ {results.hpRpm.toFixed(0)} rpm • {results.tq.toFixed(1)} ft-lb
          </div>
          <div style={{ fontSize: '9px', color: '#a5b4fc' }}>
            Static CR: {results.crStatic} | Dynamic CR: {results.crDynamic}
          </div>
          {chartData.length > 0 && (
            <div style={{ marginTop: '6px', position: 'relative', height: '40px', background: 'rgba(2,6,23,0.8)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <svg style={{ width: '100%', height: '100%', position: 'absolute' }} onMouseLeave={() => setHoverIdx(null)}>
                <polyline
                  points={chartData.map((p, i) => `${(i / (chartData.length - 1)) * 100}%,${100 - (p.hp / Math.max(...chartData.map((x) => x.hp)) || 1) * 80 - 10}%`).join(' ')}
                  fill="none"
                  stroke="#ff2bd6"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {chartData.map((p, i) => (
                  <circle
                    key={i}
                    cx={`${(i / (chartData.length - 1)) * 100}%`}
                    cy={`${100 - (p.hp / Math.max(...chartData.map((x) => x.hp)) || 1) * 80 - 10}%`}
                    r="2"
                    fill={hoverIdx === i ? '#00d4ff' : '#ff2bd6'}
                    onMouseEnter={() => setHoverIdx(i)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </svg>
            </div>
          )}
        </div>
      )}
      {selectedCamId && !results && (
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', fontSize: '11px', color: '#a5b4fc' }}>
          Calculating... {selectedBlock?.block_name} with cam...
        </div>
      )}
        </>
      )}
    </div>
  );
}

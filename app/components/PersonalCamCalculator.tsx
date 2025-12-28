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
  attachedHead?: {
    id: string;
    head_name: string;
    intake_ports?: number;
    exhaust_ports?: number;
    chamber_volume?: number;
    chamber_cc?: number;
    flow_data?: any;
  } | null;
  attachedCams?: any[];
}

interface CamOption {
  id: string;
  label: string;
  spec?: {
    intDur: number;
    exhDur: number;
    lsa: number;
    intLift: number;
    exhLift: number;
    rpmStart: number;
    rpmEnd: number;
    rockerRatio?: number;
  };
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

interface Props {
  shortBlocks?: ShortBlock[];
}

export default function PersonalCamCalculator({ shortBlocks = [] }: Props) {

  // HP display state at top level
  const [hpDisplay, setHpDisplay] = useState<string>('-');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedCamId, setSelectedCamId] = useState<string>('');
  const [camOptions, setCamOptions] = useState<CamOption[]>([]);
  const [camLoading, setCamLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const [engine, setEngine] = useState<EngineState>({ bore: 4.0, stroke: 3.5, rod: 5.956, cyl: 8, chamber: 56, pistonCc: 19.5, gasketBore: 4.06, gasketThk: 0.04, deck: 0.015, portCfm: 300 });
  const [cam, setCam] = useState<Cam>({ name: '', intDur: 200, exhDur: 200, lsa: 114, ivc: 0, intLift: 0.35, exhLift: 0.35, rpmStart: 2000, rpmEnd: 7000 });
  const [geomDisplay, setGeomDisplay] = useState({ cid: '-', crStatic: '-' });
  const [results, setResults] = useState<any>(null);


  // --- Single source of truth: set engine and cam from saved short block/head/cam ---
  useEffect(() => {
    if (!selectedBlockId) return;
    const block = shortBlocks.find(b => b.id === selectedBlockId);
    if (!block) return;

    // HEAD
    let portCfm = 300;
    let chamber = 56;
    if (block.attachedHead) {
      const head = block.attachedHead;
      if (Array.isArray(head.flow_data) && head.flow_data.length > 0) {
        portCfm = head.flow_data.reduce((max: number, pt: any) => Math.max(max, pt.intakeFlow || 0), 0) || portCfm;
      }
      chamber = typeof head.chamber_volume === 'number' ? head.chamber_volume : (typeof head.chamber_cc === 'number' ? head.chamber_cc : chamber);
    }

    // CAM
    let camSpec = null;
    if (Array.isArray(block.attachedCams) && block.attachedCams.length > 0) {
      camSpec = block.attachedCams[0];
      setSelectedCamId(camSpec.id);
    }

    setEngine({
      bore: parseFloat(block.bore || '4.0'),
      stroke: parseFloat(block.stroke || '3.5'),
      rod: parseFloat(block.rod_length || '5.956'),
      cyl: parseInt(String(block.cyl || 8), 10),
      chamber,
      pistonCc: parseFloat(block.piston_dome_dish || '19.5'),
      gasketBore: parseFloat(block.head_gasket_bore || '4.06'),
      gasketThk: parseFloat(block.head_gasket_compressed_thickness || '0.04'),
      deck: parseFloat(block.deck_height || '0.015'),
      portCfm,
    });

    if (camSpec) {
      setCam({
        name: camSpec.label || camSpec.name || '',
        intDur: camSpec.intDur || camSpec.duration_int_050 || 200,
        exhDur: camSpec.exhDur || camSpec.duration_exh_050 || 200,
        lsa: camSpec.lsa || 114,
        ivc: 0,
        intLift: camSpec.intLift || camSpec.lift_int || 0.35,
        exhLift: camSpec.exhLift || camSpec.lift_exh || 0.35,
        rpmStart: camSpec.rpmStart || camSpec.rpm_start || 2000,
        rpmEnd: camSpec.rpmEnd || camSpec.rpm_end || 7000,
        rockerRatio: camSpec.rockerRatio || camSpec.rocker_ratio || null,
      });
    }
  }, [selectedBlockId, shortBlocks]);



  // When a cam is selected, auto-fill cam fields
  useEffect(() => {
    if (!selectedCamId) return;
    // Try to find cam in attachedCams first
    const block = shortBlocks.find(b => b.id === selectedBlockId);
    let camSpec = null;
    if (block && Array.isArray(block.attachedCams)) {
      camSpec = block.attachedCams.find((c: any) => c.id === selectedCamId);
    }
    if (!camSpec && camOptions.length > 0) {
      camSpec = camOptions.find(c => c.id === selectedCamId);
    }
    if (!camSpec) return;
    setCam({
      name: camSpec.label || camSpec.name || '',
      intDur: camSpec.intDur || camSpec.spec?.intDur || camSpec.duration_int_050 || 200,
      exhDur: camSpec.exhDur || camSpec.spec?.exhDur || camSpec.duration_exh_050 || 200,
      lsa: camSpec.lsa || camSpec.spec?.lsa || 114,
      ivc: 0,
      intLift: camSpec.intLift || camSpec.spec?.intLift || camSpec.lift_int || 0.35,
      exhLift: camSpec.exhLift || camSpec.spec?.exhLift || camSpec.lift_exh || 0.35,
      rpmStart: camSpec.rpmStart || camSpec.spec?.rpmStart || camSpec.rpm_start || 2000,
      rpmEnd: camSpec.rpmEnd || camSpec.spec?.rpmEnd || camSpec.rpm_end || 7000,
      rockerRatio: camSpec.rockerRatio || camSpec.spec?.rockerRatio || camSpec.rocker_ratio || null,
    });
  }, [selectedCamId, shortBlocks, camOptions, selectedBlockId]);

  // --- Copy geometry, compression, and HP logic from CamSpecEliteSelectiveCalculator ---
  function computeEngineGeometry(engine: EngineState) {
    const PI = Math.PI;
    const CC_TO_IN3 = 0.0610237441;
    const A = (PI / 4) * engine.bore * engine.bore;
    const Ag = (PI / 4) * engine.gasketBore * engine.gasketBore;
    const Vs = A * engine.stroke;
    const Vch = engine.chamber * CC_TO_IN3;
    const Vp = engine.pistonCc * CC_TO_IN3;
    const Vg = Ag * engine.gasketThk;
    const Vd = A * engine.deck;
    const Vc = Vch + Vp + Vg + Vd;
    const crStatic = (Vs + Vc) / Vc;
    const cid = Vs * engine.cyl;
    return { cid, crStatic, Vc, A, Vs };
  }

  // Estimate NA HP (copied from CamSpecEliteSelectiveCalculator)
  function estimateNaHp({ cid, portCfm, cam, rpmEnd }: { cid: number, portCfm: number, cam: any, rpmEnd: number }) {
    // Simple formula: HP = (cid * portCfm * VE * rpmFactor) / 3456
    // VE and rpmFactor are estimated based on cam and rpm
    const ve = 0.92 - 0.01 * Math.max(0, (cam.lsa || 114) - 110); // Lower LSA = higher VE
    const rpmFactor = Math.min(1, rpmEnd / 7000);
    return ((cid * portCfm * ve * rpmFactor) / 3456);
  }

  // Update geometry display, compression ratio, and HP
  useEffect(() => {
    const geom = computeEngineGeometry(engine);
    setGeomDisplay({ cid: geom.cid.toFixed(1), crStatic: geom.crStatic.toFixed(2) });
    // Estimate HP
    const hp = estimateNaHp({
      cid: geom.cid,
      portCfm: engine.portCfm,
      cam,
      rpmEnd: cam.rpmEnd || 7000,
    });
    setHpDisplay(hp.toFixed(0));
  }, [engine, cam]);

  // When a cam is selected, auto-fill cam fields
  useEffect(() => {
    if (!selectedCamId) return;
    // Try to find cam in attachedCams first
    const block = shortBlocks.find(b => b.id === selectedBlockId);
    let camSpec = null;
    if (block && Array.isArray(block.attachedCams)) {
      camSpec = block.attachedCams.find((c: any) => c.id === selectedCamId);
    }
    if (!camSpec && camOptions.length > 0) {
      camSpec = camOptions.find(c => c.id === selectedCamId);
    }
    if (!camSpec) return;
    setCam({
      name: camSpec.label || camSpec.name || '',
      intDur: camSpec.intDur || camSpec.spec?.intDur || camSpec.duration_int_050 || 200,
      exhDur: camSpec.exhDur || camSpec.spec?.exhDur || camSpec.duration_exh_050 || 200,
      lsa: camSpec.lsa || camSpec.spec?.lsa || 114,
      ivc: 0,
      intLift: camSpec.intLift || camSpec.spec?.intLift || camSpec.lift_int || 0.35,
      exhLift: camSpec.exhLift || camSpec.spec?.exhLift || camSpec.lift_exh || 0.35,
      rpmStart: camSpec.rpmStart || camSpec.spec?.rpmStart || camSpec.rpm_start || 2000,
      rpmEnd: camSpec.rpmEnd || camSpec.spec?.rpmEnd || camSpec.rpm_end || 7000,
      rockerRatio: camSpec.rockerRatio || camSpec.spec?.rockerRatio || camSpec.rocker_ratio || null,
    });
  }, [selectedCamId, shortBlocks, camOptions, selectedBlockId]);

  // Load cams for engine family
  useEffect(() => {
    if (!selectedBlockId) {
      setCamOptions([]);
      setSelectedCamId('');
      return;
    }

    const block = shortBlocks.find(b => b.id === selectedBlockId);
    if (!block || !block.engine_family) return;

    setCamLoading(true);
    setCamError(null);

    const loadCams = async () => {
      try {
        const res = await fetch(`/api/cams/catalog?family=${encodeURIComponent(block.engine_family || '')}`);
        if (!res.ok) throw new Error('Failed to load cams');
        
        const data = await res.json();
        const formatted = (data.cams || []).map((c: any) => ({
          id: c.id,
          label: `${c.cam_name || 'Unknown'} (${c.duration_int_050 || 0}°/${c.duration_exh_050 || 0}°)`,
          spec: {
            intDur: c.duration_int_050 || 0,
            exhDur: c.duration_exh_050 || 0,
            lsa: c.lsa || 0,
            intLift: c.lift_int || 0,
            exhLift: c.lift_exh || 0,
            rpmStart: c.rpm_start || 2000,
            rpmEnd: c.rpm_end || 7000,
            rockerRatio: c.rocker_ratio || null,
          },
        }));
        setCamOptions(formatted);
      } catch (err) {
        console.error('Error loading cams:', err);
        setCamError('Failed to load camshaft library');
      } finally {
        setCamLoading(false);
      }
    };

    loadCams();
  }, [selectedBlockId, shortBlocks]);

  // Update engine state when block is selected
  useEffect(() => {
    if (!selectedBlockId) return;

    const block = shortBlocks.find(b => b.id === selectedBlockId);
    if (!block) return;

    setEngine({
      bore: parseFloat(block.bore || '4.0'),
      stroke: parseFloat(block.stroke || '3.5'),
      rod: parseFloat(block.rod_length || '5.956'),
      cyl: parseInt(String(block.cyl || 8), 10),
      chamber: block.attachedHead?.chamber_volume ? parseFloat(String(block.attachedHead.chamber_volume)) : 56,
      pistonCc: parseFloat(block.piston_dome_dish || '19.5'),
      gasketBore: parseFloat(block.head_gasket_bore || '4.06'),
      gasketThk: parseFloat(block.head_gasket_compressed_thickness || '0.04'),
      deck: parseFloat(block.deck_height || '0.015'),
      portCfm: 300,
    });
  }, [selectedBlockId, shortBlocks]);

  // Update cam when selected
  useEffect(() => {
    if (!selectedCamId) {
      setCam({ name: '', intDur: 200, exhDur: 200, lsa: 114, ivc: 0, intLift: 0.35, exhLift: 0.35, rpmStart: 2000, rpmEnd: 7000 });
      return;
    }

    const camSpec = camOptions.find(c => c.id === selectedCamId);
    if (!camSpec?.spec) return;

    setCam({
      name: camSpec.label.split(' (')[0],
      intDur: camSpec.spec.intDur,
      exhDur: camSpec.spec.exhDur,
      lsa: camSpec.spec.lsa,
      ivc: 0,
      intLift: camSpec.spec.intLift,
      exhLift: camSpec.spec.exhLift,
      rpmStart: camSpec.spec.rpmStart,
      rpmEnd: camSpec.spec.rpmEnd,
      rockerRatio: camSpec.spec.rockerRatio,
    });
  }, [selectedCamId, camOptions]);

  // Calculate engine geometry
  useEffect(() => {
    const PI = Math.PI;
    const CC_TO_IN3 = 0.0610237441;

    const A = (PI / 4) * engine.bore * engine.bore;
    const Ag = (PI / 4) * engine.gasketBore * engine.gasketBore;

    // Displacement in cubic inches
    const cid = (PI / 4) * engine.bore * engine.bore * engine.stroke * engine.cyl;

    // TDC volume (chamber + gasket + deck + piston)
    const deckVol = A * engine.deck / CC_TO_IN3;
    const gasketVol = Ag * engine.gasketThk / CC_TO_IN3;
    const tdcVol = engine.chamber + deckVol + gasketVol + engine.pistonCc;

    // BDC volume
    const bdcVol = (A * (engine.stroke / 2) / CC_TO_IN3) + tdcVol;

    const cr = bdcVol / tdcVol;

    setGeomDisplay({ cid: cid.toFixed(1), crStatic: cr.toFixed(2) });
  }, [engine]);

  // Calculate results
  useEffect(() => {
    if (!selectedBlockId || !selectedCamId) {
      setResults(null);
      return;
    }

    const block = shortBlocks.find(b => b.id === selectedBlockId);
    if (!block || !block.attachedHead) return;

    setResults({
      blockName: block.block_name,
      headName: block.attachedHead.head_name,
      camName: cam.name,
      cid: geomDisplay.cid,
      cr: geomDisplay.crStatic,
      intDur: cam.intDur,
      exhDur: cam.exhDur,
      lsa: cam.lsa,
      intLift: cam.intLift,
      exhLift: cam.exhLift,
      intPorts: block.attachedHead.intake_ports || '-',
      exhPorts: block.attachedHead.exhaust_ports || '-',
      chamberVol: block.attachedHead.chamber_volume || '-',
      rpmStart: cam.rpmStart,
      rpmEnd: cam.rpmEnd,
    });
  }, [selectedBlockId, selectedCamId, shortBlocks, cam, geomDisplay]);

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Personal Cam Calculator
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#a5b4fc' }}>
          Quick specs from your saved data
        </p>
      </div>

      {/* Selections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {/* Short Block Selection */}
        <div>
          <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Short Block
          </label>
          <select
            value={selectedBlockId}
            onChange={(e) => setSelectedBlockId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(0,212,255,0.4)',
              background: 'rgba(2,6,23,0.9)',
              color: '#f9fafb',
              fontSize: '12px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Select a short block...</option>
            {shortBlocks.map(block => (
              <option key={block.id} value={block.id}>{block.block_name}</option>
            ))}
          </select>
        </div>

        {/* Head Display */}
        <div>
          <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cylinder Head
          </label>
          <div
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(124,255,203,0.4)',
              background: 'rgba(124,255,203,0.05)',
              color: selectedBlockId && shortBlocks.find(b => b.id === selectedBlockId)?.attachedHead ? '#7CFFCB' : '#6b7280',
              fontSize: '12px',
              fontWeight: 500,
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {selectedBlockId && shortBlocks.find(b => b.id === selectedBlockId)?.attachedHead 
              ? shortBlocks.find(b => b.id === selectedBlockId)?.attachedHead?.head_name
              : 'Select block first'}
          </div>
        </div>

        {/* Camshaft Selection */}
        <div>
          <label style={{ display: 'block', color: '#c7f7ff', marginBottom: '6px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Camshaft
          </label>
          <select
            value={selectedCamId}
            onChange={(e) => setSelectedCamId(e.target.value)}
            disabled={!selectedBlockId || camLoading || camOptions.length === 0}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,43,214,0.4)',
              background: 'rgba(2,6,23,0.9)',
              color: '#f9fafb',
              fontSize: '12px',
              fontWeight: 500,
              outline: 'none',
              cursor: !selectedBlockId || camLoading || camOptions.length === 0 ? 'not-allowed' : 'pointer',
              opacity: !selectedBlockId || camLoading || camOptions.length === 0 ? 0.5 : 1,
            }}
          >
            <option value="">
              {!selectedBlockId ? 'Select block first' : camLoading ? 'Loading cams...' : camOptions.length === 0 ? 'No cams found' : 'Select a camshaft...'}
            </option>
            {camOptions.map(cam => (
              <option key={cam.id} value={cam.id}>{cam.label}</option>
            ))}
          </select>
          {camError && <div style={{ color: '#fb7185', fontSize: '10px', marginTop: '4px' }}>{camError}</div>}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Summary Box */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6,11,30,0.8)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '11px' }}>
              <div>
                <div style={{ color: '#a5b4fc', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Displacement</div>
                <div style={{ color: '#f9fafb', fontSize: '14px', fontWeight: 600 }}>{results.cid} CID</div>
              </div>
              <div>
                <div style={{ color: '#a5b4fc', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compression Ratio</div>
                <div style={{ color: '#f9fafb', fontSize: '14px', fontWeight: 600 }}>{results.cr} : 1</div>
              </div>
              <div>
                <div style={{ color: '#a5b4fc', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chamber Vol</div>
                <div style={{ color: '#f9fafb', fontSize: '14px', fontWeight: 600 }}>{results.chamberVol} cc</div>
              </div>
              <div>
                <div style={{ color: '#a5b4fc', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Port Count</div>
                <div style={{ color: '#f9fafb', fontSize: '14px', fontWeight: 600 }}>{results.intPorts}I / {results.exhPorts}E</div>
              </div>
            </div>
          </div>

          {/* Cam Specs */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6,11,30,0.8)', border: '1px solid rgba(255,43,214,0.25)' }}>
            <div style={{ fontSize: '10px', color: '#a5b4fc', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Cam Specifications</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', fontSize: '11px' }}>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>Int Duration</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{results.intDur}°</div>
              </div>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>Exh Duration</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{results.exhDur}°</div>
              </div>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>Lobe Sep Angle</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{results.lsa}°</div>
              </div>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>Int Lift</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{parseFloat(String(results.intLift)).toFixed(3)}"</div>
              </div>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>Exh Lift</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{parseFloat(String(results.exhLift)).toFixed(3)}"</div>
              </div>
              <div>
                <div style={{ color: '#7dd3fc', fontSize: '10px', marginBottom: '2px' }}>RPM Range</div>
                <div style={{ color: '#f9fafb', fontWeight: 500 }}>{results.rpmStart} - {results.rpmEnd}</div>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(124,255,203,0.05)', border: '1px solid rgba(124,255,203,0.25)', fontSize: '11px', color: '#e5e7eb' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#7CFFCB', fontWeight: 600 }}>Block:</span> {results.blockName}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#7CFFCB', fontWeight: 600 }}>Head:</span> {results.headName}
            </div>
            <div>
              <span style={{ color: '#7CFFCB', fontWeight: 600 }}>Cam:</span> {results.camName}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '12px', borderRadius: '8px', border: '1px dashed rgba(0,212,255,0.2)' }}>
          Select a short block and camshaft to view specifications
        </div>
      )}
    </div>
  );
}

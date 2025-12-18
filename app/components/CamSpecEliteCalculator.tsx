"use client";

import { useEffect } from "react";

export default function CamSpecEliteCalculator() {
  useEffect(() => {
    // Chart.js script will load and be available globally
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

const htmlContent = `
<div id="gofast-widget" style="max-width: 980px; margin: 0 auto; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f5f5f5;">
  <div style="background: radial-gradient(circle at top left, #ff2bd6 0%, #00d4ff 35%, #050816 75%, #020617 100%); border-radius: 18px; padding: 18px; box-shadow: 0 16px 40px rgba(0,0,0,0.7); border: 1px solid rgba(0,212,255,0.45);">
    <h2 style="margin: 0 0 6px 0; text-align: center; font-size: 17px; letter-spacing: 0.12em; text-transform: uppercase; color: #7CFFCB;">
      Cam Spec Elite Calculator
    </h2>
    <p style="font-size: 11px; color:#c7d2fe; text-align:center; margin: 0 0 12px 0;">
      Step 1: Engine • Step 2: Cam • Step 3: Intake/Fuel/Boost → Dyno curve. Estimations only; real-world dyno wins.
    </p>

    <!-- STEP TABS (visual only) -->
    <div style="display:flex; gap:4px; margin-bottom:12px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; justify-content:center;">
      <div style="padding:4px 10px; border-radius:999px; background:rgba(255,43,214,0.18); border:1px solid rgba(255,43,214,0.75); color:#ffd6f5;">1 • Engine</div>
      <div style="padding:4px 10px; border-radius:999px; background:rgba(0,212,255,0.10); border:1px solid rgba(0,212,255,0.35); color:#c7f7ff;">2 • Cam</div>
      <div style="padding:4px 10px; border-radius:999px; background:rgba(124,255,203,0.10); border:1px solid rgba(124,255,203,0.35); color:#d7fff0;">3 • Tune</div>
    </div>

    <!-- STEP 1: ENGINE GEOMETRY -->
    <div style="border-radius:12px; padding:10px 12px; background:rgba(6,11,30,0.78); border:1px solid rgba(0,212,255,0.22); margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <h3 style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#e5e7eb;">Step 1 • Engine Geometry</h3>
        <span style="font-size:10px; color:#a5b4fc;">Bore • Stroke • Rod • Volumes • Port Flow</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; font-size:12px;">
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Bore (in)</label>
          <input id="eng_bore" type="number" value="4.03" step="0.001" min="2.0" max="6.0"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Stroke (in)</label>
          <input id="eng_stroke" type="number" value="3.5" step="0.001" min="2.0" max="6.0"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Rod Length (in)</label>
          <input id="eng_rod" type="number" value="5.956" step="0.001" min="4.5" max="7.5"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Cylinders</label>
          <input id="eng_cyl" type="number" value="8" min="3" max="16" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Chamber Volume (cc)</label>
          <input id="eng_chamber" type="number" value="56" step="0.1" min="30" max="120"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Piston Dome/Dish (cc)</label>
          <input id="eng_piston_cc" type="number" value="19.5" step="0.1" min="-40" max="40"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
          <span style="font-size:10px; color:#a5b4fc;">Negative = dish, Positive = dome</span>
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Gasket Bore (in)</label>
          <input id="eng_gasket_bore" type="number" value="4.06" step="0.001" min="2.0" max="6.0"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Gasket Thickness (in)</label>
          <input id="eng_gasket_thk" type="number" value="0.040" step="0.001" min="0.01" max="0.2"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Deck Clearance (in)</label>
          <input id="eng_deck" type="number" value="0.015" step="0.001" min="-0.05" max="0.2"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Port Flow (cfm @28&quot; per cyl)</label>
          <input id="eng_port_cfm" type="number" value="300" step="1" min="100" max="450"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
      </div>

      <div id="eng_geom_summary"
           style="margin-top:8px; padding:6px 8px; border-radius:8px; background:rgba(2,6,23,0.85); border:1px solid rgba(255,43,214,0.30); font-size:11px; color:#e5e7eb;">
        Displacement: - CID • Static CR: - : 1
      </div>
    </div>

    <!-- STEP 2: CAM LIBRARY -->
    <div style="border-radius:12px; padding:10px 12px; background:rgba(6,11,30,0.78); border:1px solid rgba(255,43,214,0.22); margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <h3 style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#e5e7eb;">Step 2 • Cam Library</h3>
        <span style="font-size:10px; color:#a5b4fc;">Build &amp; select cam</span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:8px; font-size:12px; margin-bottom:8px;">
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Cam Name</label>
          <input id="cam_name" type="text" value="F303+"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Int Dur @ .050 (°)</label>
          <input id="cam_int_dur" type="number" value="226" min="180" max="290" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Exh Dur @ .050 (°)</label>
          <input id="cam_exh_dur" type="number" value="234" min="180" max="300" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">LSA (°)</label>
          <input id="cam_lsa" type="number" value="114" min="104" max="118" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">IVC @ .050 (ABDC °)</label>
          <input id="cam_ivc" type="number" value="43" min="40" max="90" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Int Lift (in)</label>
          <input id="cam_int_lift" type="number" value="0.585" min="0.350" max="0.900" step="0.001"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Exh Lift (in)</label>
          <input id="cam_exh_lift" type="number" value="0.574" min="0.350" max="0.900" step="0.001"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Cam RPM Start</label>
          <input id="cam_rpm_start" type="number" value="3000" min="1000" max="8000" step="100"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#ffd6f5; margin-bottom:2px;">Cam RPM End</label>
          <input id="cam_rpm_end" type="number" value="6500" min="2000" max="10000" step="100"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(255,43,214,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between;">
        <div style="display:flex; gap:8px; align-items:center;">
          <button id="btn_add_cam"
                  style="padding:6px 10px; border-radius:999px; border:0; background:linear-gradient(135deg,#7CFFCB,#00d4ff); color:#020617; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer;">
            Save Cam
          </button>
          <span style="font-size:11px; color:#a5b4fc;">Cam Library:</span>
          <select id="cam_select"
                  style="min-width:160px; padding:4px 8px; border-radius:999px; border:1px solid rgba(0,212,255,0.45); background:rgba(2,6,23,0.9); color:#e5e7eb; font-size:11px; outline:none;">
            <option value="">(Current Unsaved Cam)</option>
          </select>
        </div>
        <div id="cam_dyn_cr_display" style="font-size:11px; color:#7CFFCB;">
          Dynamic CR (est): -
        </div>
      </div>
    </div>

    <!-- STEP 3: TUNE / INTAKE / FUEL / BOOST / GRAPH RANGE -->
    <div style="border-radius:12px; padding:10px 12px; background:rgba(6,11,30,0.78); border:1px solid rgba(124,255,203,0.22); margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <h3 style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#e5e7eb;">Step 3 • Intake, Fuel & Boost</h3>
        <span style="font-size:10px; color:#a5b4fc;">Tune layer • Dyno RPM range</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; font-size:12px;">
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Intake Type</label>
          <select id="tune_intake"
                  style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
            <option value="dual_plane">Dual Plane NA</option>
            <option value="single_plane" selected>Single Plane NA</option>
            <option value="tunnel_ram">Tunnel Ram NA</option>
            <option value="boosted">Boosted (Turbo/SC)</option>
          </select>
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Fuel</label>
          <select id="tune_fuel"
                  style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
            <option value="pump91">Pump 91</option>
            <option value="pump93" selected>Pump 93</option>
            <option value="race_gas">Race Gas</option>
            <option value="e85">E85</option>
          </select>
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Boost (psi)</label>
          <input id="tune_boost" type="number" value="0" min="0" max="40" step="1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Target AFR (WOT)</label>
          <input id="tune_afr" type="number" value="12.0" min="9" max="13" step="0.1"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Graph RPM Start</label>
          <input id="graph_rpm_start" type="number" value="2000" min="1000" max="9000" step="250"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
        <div>
          <label style="display:block; color:#c7f7ff; margin-bottom:2px;">Graph RPM End</label>
          <input id="graph_rpm_end" type="number" value="7000" min="2000" max="10000" step="250"
                 style="width:100%; padding:6px 8px; border-radius:8px; border:1px solid rgba(0,212,255,0.35); background:rgba(2,6,23,0.9); color:#f9fafb; font-size:12px; outline:none;">
        </div>
      </div>
      <div style="text-align:center; margin-top:10px;">
        <button id="btn_calc_dyno"
                style="padding:7px 20px; border-radius:999px; border:0; background:linear-gradient(135deg,#ff2bd6,#00d4ff,#7CFFCB); color:#020617; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer;">
          Run Cam Spec Elite
        </button>
      </div>
    </div>

    <!-- RESULTS -->
    <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:10px; font-size:12px;">
      <!-- HP/TQ BAR -->
      <div style="flex:1 1 260px; max-width:460px; padding:10px 12px; border-radius:12px; background:rgba(2,6,23,0.9); border:1px solid rgba(0,212,255,0.30);">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#a5b4fc; margin-bottom:4px;">
          Peak Output
        </div>
        <div id="res_peak_summary" style="font-size:14px; font-weight:700; color:#e5e7eb;">
          -
        </div>
        <div style="margin-top:8px; position:relative; height:16px; border-radius:999px; background:rgba(2,6,23,0.9); border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
          <div id="hpBarFill"
               style="position:absolute; left:0; top:0; bottom:0; width:0%; background:linear-gradient(90deg,#ff2bd6,#00d4ff); opacity:0.9;"></div>
          <div id="tqBarFill"
               style="position:absolute; left:0; top:0; bottom:0; width:0%; background:linear-gradient(90deg,#7CFFCB,#00d4ff); opacity:0.70;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10px;">
          <span style="color:#ff2bd6;">HP bar (relative)</span>
          <span style="color:#7CFFCB;">TQ bar (relative)</span>
        </div>
      </div>

      <!-- CR CARD -->
      <div style="min-width:160px; padding:10px 12px; border-radius:12px; background:rgba(2,6,23,0.9); border:1px solid rgba(255,43,214,0.25); text-align:center;">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#a5b4fc;">Compression Ratios</div>
        <div id="res_boost_cr" style="font-size:13px; font-weight:800; color:#e5e7eb; margin-top:2px;">
          - / - / -
        </div>
        <div style="font-size:10px; color:#a5b4fc; margin-top:2px;">
          Static / Dynamic / Effective (boosted)
        </div>
      </div>
    </div>

    <!-- DYNO GRAPH -->
    <div style="border-radius:12px; padding:10px; background:rgba(2,6,23,0.9); border:1px solid rgba(0,212,255,0.18); height:280px;">
      <canvas id="dynoChart"></canvas>
    </div>
  </div>
</div>

<script>
(function() {
  const camLibrary = [];

  // ---------- ENGINE GEOMETRY ----------
  function computeEngineGeometry() {
    const bore        = Number(document.getElementById('eng_bore').value) || 0;
    const stroke      = Number(document.getElementById('eng_stroke').value) || 0;
    const rod         = Number(document.getElementById('eng_rod').value) || 0;
    const cyl         = Number(document.getElementById('eng_cyl').value) || 0;
    const chamberCc   = Number(document.getElementById('eng_chamber').value) || 0;
    const pistonCc    = Number(document.getElementById('eng_piston_cc').value) || 0;
    const gasketBore  = Number(document.getElementById('eng_gasket_bore').value) || 0;
    const gasketThk   = Number(document.getElementById('eng_gasket_thk').value) || 0;
    const deck        = Number(document.getElementById('eng_deck').value) || 0;
    const portCfm     = Number(document.getElementById('eng_port_cfm').value) || 0;

    const ccPerIn3 = 16.387064;

    if (bore <= 0 || stroke <= 0 || cyl <= 0 || chamberCc <= 0) {
      return { cid:0, crStatic:0, rod, stroke, portCfm };
    }

    const sweptPerCyl_in3 = Math.PI / 4 * bore * bore * stroke;
    const sweptPerCyl_cc  = sweptPerCyl_in3 * ccPerIn3;

    let gasketVol_cc = 0;
    if (gasketBore > 0 && gasketThk > 0) {
      const gasket_in3 = Math.PI / 4 * gasketBore * gasketBore * gasketThk;
      gasketVol_cc = gasket_in3 * ccPerIn3;
    }

    let deckVol_cc = 0;
    if (deck !== 0) {
      const deck_in3 = Math.PI / 4 * bore * bore * deck;
      deckVol_cc = deck_in3 * ccPerIn3;
    }

    const clearCc = chamberCc + pistonCc + gasketVol_cc + deckVol_cc;
    let crStatic = 0;
    if (clearCc > 0) {
      crStatic = (sweptPerCyl_cc + clearCc) / clearCc;
    }

    const cid = sweptPerCyl_in3 * cyl;

    return {
      cid,
      crStatic,
      rod,
      stroke,
      portCfm
    };
  }

  function updateEngineGeometryDisplay() {
    const geom = computeEngineGeometry();
    const el = document.getElementById('eng_geom_summary');
    if (!el) return;

    if (!geom.cid || !geom.crStatic) {
      el.textContent = 'Displacement: - CID • Static CR: - : 1';
    } else {
      el.textContent = 'Displacement: ' + geom.cid.toFixed(1) +
                       ' CID • Static CR: ' + geom.crStatic.toFixed(2) + ' : 1';
    }
  }

  function getEngine() {
    const geom = computeEngineGeometry();
    return {
      cid: geom.cid || 0,
      crStatic: geom.crStatic || 0,
      rod: geom.rod || 0,
      stroke: geom.stroke || 0,
      cyl: Number(document.getElementById('eng_cyl').value) || 8,
      portCfm: geom.portCfm || 0
    };
  }

  // ---------- CAM / TUNE ----------
  function getCamFromInputs() {
    return {
      name: document.getElementById('cam_name').value.trim() || 'Custom Cam',
      intDur: Number(document.getElementById('cam_int_dur').value) || 230,
      exhDur: Number(document.getElementById('cam_exh_dur').value) || 236,
      lsa: Number(document.getElementById('cam_lsa').value) || 110,
      ivc: Number(document.getElementById('cam_ivc').value) || 70,
      intLift: Number(document.getElementById('cam_int_lift').value) || 0.500,
      exhLift: Number(document.getElementById('cam_exh_lift').value) || 0.500,
      rpmStart: Number(document.getElementById('cam_rpm_start').value) || 3000,
      rpmEnd: Number(document.getElementById('cam_rpm_end').value) || 6500
    };
  }

  function getTune() {
    let start = Number(document.getElementById('graph_rpm_start').value) || 2000;
    let end   = Number(document.getElementById('graph_rpm_end').value) || 7000;
    if (end <= start) end = start + 500;

    return {
      intake: document.getElementById('tune_intake').value,
      fuel: document.getElementById('tune_fuel').value,
      boostPsi: Number(document.getElementById('tune_boost').value) || 0,
      afr: Number(document.getElementById('tune_afr').value) || 12.0,
      rpmStart: start,
      rpmEnd: end,
      rpmStep: 250
    };
  }

  // ---------- FACTORS ----------
  function fuelFactor(fuel) {
    if (fuel === 'e85') return 1.07;
    if (fuel === 'race_gas') return 1.04;
    if (fuel === 'pump93') return 1.02;
    return 1.0;
  }

  function intakeFactor(intake) {
    if (intake === 'dual_plane') return 0.96;
    if (intake === 'single_plane') return 1.0;
    if (intake === 'tunnel_ram') return 1.05;
    if (intake === 'boosted') return 1.02;
    return 1.0;
  }

  function boostFactor(boostPsi, fuel) {
    if (boostPsi <= 0) return 1.0;
    const eff = (fuel === 'e85' || fuel === 'race_gas') ? 0.92 : 0.85;
    const pr = 1 + (boostPsi / 14.7);
    return 1 + (pr - 1) * eff;
  }

  function afrFactor(afr, fuel) {
    const target = (fuel === 'e85') ? 11.0 : 12.5;
    const diff = afr - target;
    return 1 - Math.min(Math.abs(diff) * 0.02, 0.15);
  }

  // ---------- DYNAMIC CR ----------
  function estimateDynamicCR(engine, cam) {
    const crStatic = engine.crStatic;
    const stroke   = engine.stroke;
    let rod        = engine.rod;

    if (!crStatic || crStatic <= 0 || !stroke || stroke <= 0) return 0;
    if (!rod || rod <= 0) rod = stroke * 1.6;

    const ivcDeg = cam.ivc || 0;
    const a = stroke / 2;
    const theta = (Math.PI / 180) * (180 + ivcDeg);

    const sinT = Math.sin(theta);
    const inner = Math.max(0, rod*rod - (a * sinT) * (a * sinT));
    const pistonPos = a * (1 - Math.cos(theta)) + rod - Math.sqrt(inner);

    const dynStroke = Math.max(0.1, Math.min(stroke, pistonPos));
    const ratio = dynStroke / stroke;

    let dynCR = 1 + ratio * (crStatic - 1);
    dynCR = Math.max(5.0, Math.min(15.0, dynCR));
    return dynCR;
  }

  // ---------- NA PEAK HP / TQ ESTIMATE ----------
  function estimateNaHp(engine, cam, tune) {
    const dynCR = estimateDynamicCR(engine, cam);

    let rr = 1.6;
    if (engine.rod > 0 && engine.stroke > 0) rr = engine.rod / engine.stroke;
    const rrFactor = 1 + Math.max(-0.08, Math.min(0.08, (rr - 1.6) * 0.15));

    let baseVe = 0.80 + (cam.intDur - 200) * 0.002;
    baseVe += (cam.intLift - 0.450) * 0.5;
    baseVe = Math.max(0.75, Math.min(1.25, baseVe));

    let headFactor = 1.0;
    if (engine.portCfm > 0) {
      const baselineCfm = 260;
      headFactor = Math.pow(engine.portCfm / baselineCfm, 0.35);
      headFactor = Math.max(0.85, Math.min(1.20, headFactor));
    }

    const ve = baseVe * rrFactor * headFactor;

    const fFuel   = fuelFactor(tune.fuel);
    const fIntake = intakeFactor(tune.intake);
    const fAfr    = afrFactor(tune.afr, tune.fuel);

    const raw = engine.cid * ve * dynCR * fFuel * fIntake * fAfr;

    // Calibrated so F303+ 357 combo ≈ mid-400s hp NA
    const hpNa = raw / 6.65;
    const boostMult = boostFactor(tune.boostPsi, tune.fuel);
    const hpFinal = hpNa * boostMult;

    const range = cam.rpmEnd - cam.rpmStart;
    const hpRpm = Math.max(2500, Math.min(9500, cam.rpmEnd - 0.05 * range || 6000));
    const tqAtHp = hpFinal * 5252 / hpRpm;

    return { hp: hpFinal, dynCR, hpRpm, tqAtHp };
  }

  // ---------- BUILD CURVE (HP ONLY, TRUE PEAK AT hpRpm) ----------
  function buildCurve(engine, cam, tune, dynCR, hpData) {
    const hpPeak = hpData.hp || 0;
    const hpRpm  = hpData.hpRpm || ((tune.rpmStart + tune.rpmEnd) / 2);
    const effCR  = dynCR * boostFactor(tune.boostPsi, tune.fuel);

    const startRpm = tune.rpmStart;
    const endRpm   = tune.rpmEnd;

    const upSpan   = Math.max(500, hpRpm - startRpm);  // ramp up to peak
    const downSpan = Math.max(800, endRpm - hpRpm);    // fall after peak

    const points = [];

    for (let r = startRpm; r <= endRpm; r += tune.rpmStep) {
      if (hpPeak <= 0 || r <= 0) {
        points.push({ rpm: r, hp: 0, tq: 0, dynCR, effCR });
        continue;
      }

      let shape;

      if (r <= hpRpm) {
        // Rising side: ~20% at start, smooth to 1.0 at hpRpm
        const tRaw = (r - startRpm) / upSpan;
        const t = Math.max(0, Math.min(1, tRaw));
        shape = 0.20 + 0.80 * Math.pow(t, 1.6);
      } else {
        // Falling side: strictly decreasing from 1.0 at hpRpm
        const tRaw = (r - hpRpm) / downSpan;
        const t = Math.max(0, Math.min(1, tRaw));
        shape = 1.0 - 0.95 * Math.pow(t, 1.4); // 1.0 → 0.05
        if (shape < 0.05) shape = 0.05;
      }

      const hp = hpPeak * shape;
      const tq = hp * 5252 / r;

      points.push({ rpm: r, hp, tq, dynCR, effCR });
    }

    return { points, dynCR, effCR };
  }

  // ---------- CAM LIBRARY UI ----------
  function refreshCamSelect() {
    const sel = document.getElementById('cam_select');
    while (sel.options.length > 1) sel.remove(1);
    camLibrary.forEach((cam, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = cam.name;
      sel.appendChild(opt);
    });
  }

  function updateDynamicCrDisplay() {
    const eng = getEngine();
    let cam = getCamFromInputs();
    const sel = document.getElementById('cam_select');
    if (sel.value !== '') {
      const idx = Number(sel.value);
      if (!isNaN(idx) && camLibrary[idx]) cam = camLibrary[idx];
    }
    const dyn = estimateDynamicCR(eng, cam);
    const el = document.getElementById('cam_dyn_cr_display');
    if (!el) return;
    if (!dyn) el.textContent = 'Dynamic CR (est): -';
    else el.textContent = 'Dynamic CR (est): ' + dyn.toFixed(2) + ' : 1';
  }

  document.getElementById('btn_add_cam').addEventListener('click', function() {
    const cam = getCamFromInputs();
    camLibrary.push(cam);
    refreshCamSelect();
    updateDynamicCrDisplay();
  });

  document.getElementById('cam_select').addEventListener('change', updateDynamicCrDisplay);

  [
    'eng_bore','eng_stroke','eng_rod','eng_cyl','eng_chamber','eng_piston_cc',
    'eng_gasket_bore','eng_gasket_thk','eng_deck','eng_port_cfm',
    'cam_ivc','cam_int_dur','cam_int_lift','cam_rpm_start','cam_rpm_end'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', function() {
      updateEngineGeometryDisplay();
      updateDynamicCrDisplay();
    });
  });

  // ---------- CHART (HP ONLY) ----------
  let dynoChart = null;

  function renderDynoChart(points) {
    const canvas = document.getElementById('dynoChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const labels = points.map(p => p.rpm);
    const hpData = points.map(p => p.hp);

    if (dynoChart) {
      dynoChart.data.labels = labels;
      dynoChart.data.datasets[0].data = hpData;
      dynoChart.update();
      return;
    }

    dynoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Horsepower',
            data: hpData,
            borderWidth: 2,
            tension: 0.25,
            yAxisID: 'y',
            borderColor: '#00d4ff',
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb',
              font: { size: 11 }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Engine Speed (RPM)',
              color: '#a5b4fc',
              font: { size: 11 }
            },
            ticks: { color: '#a5b4fc', maxTicksLimit: 9 },
            grid: { color: 'rgba(0,212,255,0.12)' }
          },
          y: {
            position: 'left',
            title: {
              display: true,
              text: 'Horsepower (hp)',
              color: '#e5e7eb',
              font: { size: 11 }
            },
            ticks: { color: '#e5e7eb' },
            grid: { color: 'rgba(255,43,214,0.10)' }
          }
        }
      }
    });
  }

  // ---------- RESULTS ----------
  function updateResultCards(engine, dynCR, effCR, peakInfo) {
    const summaryEl = document.getElementById('res_peak_summary');
    const hpBarFill = document.getElementById('hpBarFill');
    const tqBarFill = document.getElementById('tqBarFill');

    if (peakInfo && summaryEl) {
      summaryEl.textContent =
        peakInfo.hp.toFixed(1) + ' hp @ ' + peakInfo.hpRpm.toFixed(0) + ' rpm • ' +
        peakInfo.tq.toFixed(1) + ' ft-lb @ ' + peakInfo.hpRpm.toFixed(0) + ' rpm';
    }

    const maxVal = Math.max(peakInfo.hp, peakInfo.tq, 1);
    if (hpBarFill) hpBarFill.style.width = (peakInfo.hp / maxVal * 100).toFixed(1) + '%';
    if (tqBarFill) tqBarFill.style.width = (peakInfo.tq / maxVal * 100).toFixed(1) + '%';

    const crEl = document.getElementById('res_boost_cr');
    if (crEl) {
      const staticCR = engine.crStatic || 0;
      if (!staticCR || !dynCR || !effCR) {
        crEl.textContent = '- / - / -';
      } else {
        crEl.textContent =
          staticCR.toFixed(2) + ' / ' +
          dynCR.toFixed(2)   + ' / ' +
          effCR.toFixed(2);
      }
    }
  }

  // ---------- RUN ----------
  document.getElementById('btn_calc_dyno').addEventListener('click', function() {
    const eng = getEngine();
    let cam = getCamFromInputs();
    const sel = document.getElementById('cam_select');
    if (sel.value !== '') {
      const idx = Number(sel.value);
      if (!isNaN(idx) && camLibrary[idx]) cam = camLibrary[idx];
    }
    const tune = getTune();

    const hpData = estimateNaHp(eng, cam, tune);
    const dynCR  = hpData.dynCR;
    const curveData = buildCurve(eng, cam, tune, dynCR, hpData);

    renderDynoChart(curveData.points);
    updateResultCards(eng, dynCR, curveData.effCR, {
      hp: hpData.hp,
      hpRpm: hpData.hpRpm,
      tq: hpData.tqAtHp
    });
  });

  // Init with defaults
  updateEngineGeometryDisplay();
  updateDynamicCrDisplay();
  document.getElementById('btn_calc_dyno').click();
})();
</script>
`;

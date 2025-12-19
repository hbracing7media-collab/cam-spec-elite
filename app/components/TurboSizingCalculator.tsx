'use client';

import { useEffect, useMemo, useState } from 'react';

type UnitSystem = 'imperial' | 'metric';
type TurboConfig = 'single' | 'twin';

type CalcFail = { ok: false; error?: string };
type CalcSuccess = {
  ok: true;
  unitWarning: string;
  prWarn: string;
  boostText: string;
  prNeeded: number;
  empText: string;
  empLowRatio: number;
  empHighRatio: number;
  compSizeSuggestion: string;
  hpPerTurbo: number;
  turbineAR: string;
  turbineNote: string;
};

type CalcResult = CalcFail | CalcSuccess;

function isFiniteNum(n: number) {
  return Number.isFinite(n);
}

function formatNumber(value: number, decimals: number) {
  if (!isFiniteNum(value)) return '–';
  return value.toFixed(decimals);
}

export default function TurboSizingCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  const [displacement, setDisplacement] = useState('');
  const [cylinders, setCylinders] = useState('8');
  const [rpm, setRpm] = useState('');
  const [ve, setVe] = useState('90');
  const [targetPower, setTargetPower] = useState('');
  const [turboConfig, setTurboConfig] = useState<TurboConfig>('single');

  const [error, setError] = useState('');
  const [resultsOpacity, setResultsOpacity] = useState(0.35);

  const lblDisplacementUnit = unitSystem === 'imperial' ? '(CID)' : '(Liters)';
  const displacementPlaceholder = unitSystem === 'imperial' ? '302' : '2.0';
  const targetPlaceholder = '800';

  function clearError() {
    setError('');
  }

  function showError(msg: string) {
    setError(msg);
  }

  function resetAll() {
    setDisplacement('');
    setRpm('');
    setVe('90');
    setTargetPower('');
    setTurboConfig('single');
    setCylinders('8');
    clearError();
    setResultsOpacity(0.35);
  }

  function suggestCompressorSize(hpPerTurbo: number, litersPerTurbo: number) {
    if (!isFiniteNum(hpPerTurbo) || hpPerTurbo <= 0 || !isFiniteNum(litersPerTurbo) || litersPerTurbo <= 0) return '–';

    const isSmall = litersPerTurbo <= 2.3;
    const isLarge = litersPerTurbo >= 5.0;

    if (isSmall) {
      if (hpPerTurbo <= 350) return '46–52mm inducer (GT28/GT30 class, ~250–350 HP per turbo)';
      if (hpPerTurbo <= 500) return '52–58mm inducer (GTX3071/3076, ~350–500 HP per turbo)';
      if (hpPerTurbo <= 650) return '56–62mm inducer (EFR 7670, GTX3076/3582, ~500–650 HP per turbo)';
      if (hpPerTurbo <= 850) return '60–67mm inducer (GTX35R, EFR8374, 6062–6266, ~650–850 HP per turbo)';
      if (hpPerTurbo <= 1050) return '65–72mm inducer (S362/S366, 6466–6766, ~850–1050 HP per turbo)';
      return '72mm+ inducer (large S300/S400, 1050+ HP per turbo)';
    }

    if (isLarge) {
      if (hpPerTurbo <= 500) return '60–68mm inducer (GT30/3076, small S300, ~350–500 HP per turbo)';
      if (hpPerTurbo <= 700) return '68–76mm inducer (S366 / 6766 range, ~500–700 HP per turbo)';
      if (hpPerTurbo <= 900) return '72–80mm inducer (S372 / 7175 range, ~700–900 HP per turbo)';
      if (hpPerTurbo <= 1100) return '76–82mm inducer (large S372 / 7675, ~900–1100 HP per turbo)';
      return '80–88mm+ inducer (S400 / GT45 class, 1100+ HP per turbo)';
    }

    if (hpPerTurbo <= 350) return '48–54mm inducer (small T3/T4, GT28/GT30, ~250–350 HP per turbo)';
    if (hpPerTurbo <= 500) return '54–60mm inducer (GT30/3076, 5858 range, ~350–500 HP per turbo)';
    if (hpPerTurbo <= 650) return '58–64mm inducer (GTX3076/3582, 6062, ~500–650 HP per turbo)';
    if (hpPerTurbo <= 800) return '62–68mm inducer (GTX3582, 6266–6466, S362, ~650–800 HP per turbo)';
    if (hpPerTurbo <= 1000) return '68–76mm inducer (S366, 6766–7175, ~800–1000 HP per turbo)';
    if (hpPerTurbo <= 1200) return '76–80mm inducer (S372, 7675, ~1000–1200 HP per turbo)';
    return '80–88mm+ inducer (S400/GT45 class, 1200+ HP per turbo)';
  }

  function targetEMPRange(hpPerLiter: number): [number, number] {
    if (!isFiniteNum(hpPerLiter) || hpPerLiter <= 0) return [1.3, 1.8];
    if (hpPerLiter <= 120) return [1.1, 1.5];
    if (hpPerLiter <= 180) return [1.3, 1.8];
    return [1.5, 2.0];
  }

  function suggestTurbineAR(hpPerTurbo: number, litersPerTurbo: number, rpmPeak: number, boostPsiNeeded: number) {
    if (!isFiniteNum(hpPerTurbo) || hpPerTurbo <= 0 || litersPerTurbo <= 0) return { range: '–', note: '' };

    const hpPerLiter = hpPerTurbo / litersPerTurbo;
    const isSmall = litersPerTurbo <= 2.3;
    const isLarge = litersPerTurbo >= 5.0;

    let baseLow: number | null = null;
    let baseHigh: number | null = null;
    let rangeDescriptor = '';

    if (isSmall) {
      if (hpPerTurbo <= 350) {
        baseLow = 0.48;
        baseHigh = 0.55;
      } else if (hpPerTurbo <= 500) {
        baseLow = 0.52;
        baseHigh = 0.6;
      } else if (hpPerTurbo <= 650) {
        baseLow = 0.55;
        baseHigh = 0.64;
      } else if (hpPerTurbo <= 800) {
        baseLow = 0.6;
        baseHigh = 0.68;
      } else {
        baseLow = 0.64;
        baseHigh = 0.72;
        rangeDescriptor = ' (upper limit for small-frame turbos)';
      }
    } else if (isLarge) {
      if (hpPerTurbo <= 500) {
        baseLow = 0.78;
        baseHigh = 0.95;
      } else if (hpPerTurbo <= 700) {
        baseLow = 0.85;
        baseHigh = 1.05;
      } else if (hpPerTurbo <= 900) {
        baseLow = 0.95;
        baseHigh = 1.15;
      } else {
        baseLow = 1.05;
        baseHigh = 1.3;
      }
    } else {
      if (hpPerTurbo <= 400) {
        baseLow = 0.63;
        baseHigh = 0.82;
      } else if (hpPerTurbo <= 650) {
        baseLow = 0.75;
        baseHigh = 0.96;
      } else if (hpPerTurbo <= 900) {
        baseLow = 0.85;
        baseHigh = 1.08;
      } else {
        baseLow = 1.0;
        baseHigh = 1.25;
      }
    }

    if (baseLow === null || baseHigh === null) return { range: '–', note: '' };

    const boostSafe = isFiniteNum(boostPsiNeeded) ? boostPsiNeeded : 0;
    const severity = boostSafe >= 32 || hpPerLiter >= 210 ? 2 : boostSafe >= 24 || hpPerLiter >= 170 ? 1 : 0;

    if (severity > 0) {
      const lowDelta = severity === 2 ? 0.05 : 0.03;
      const highDelta = severity === 2 ? 0.08 : 0.05;
      baseLow = Math.min(baseLow + lowDelta, baseHigh - 0.01);
      baseHigh = Math.min(baseHigh + highDelta, 1.4);
    }

    const range = `${baseLow.toFixed(2)}–${baseHigh.toFixed(2)} A/R${rangeDescriptor}`;

    const noteParts: string[] = [];
    if (rpmPeak >= 7000 || hpPerLiter >= 180) noteParts.push('Use upper half for high-RPM or race combos.');
    else if (rpmPeak <= 6000 && hpPerLiter <= 130) noteParts.push('Use lower half for quicker spool on street builds.');
    else noteParts.push('Middle of the range is a typical starting point.');

    if (severity === 1) noteParts.push('Elevated boost: bias toward the larger trim to keep EMP in check.');
    else if (severity === 2) noteParts.push('High boost target: step up a turbine size or larger trim to control EMP.');

    return { range, note: noteParts.join(' ') };
  }

  const calc: CalcResult = useMemo(() => {
    const dispRaw = Number(displacement);
    const rpmRaw = Number(rpm);
    const veRaw = Number(ve);
    const targetRaw = Number(targetPower);

    const turboCount = turboConfig === 'twin' ? 2 : 1;

    const anyEntered = displacement.trim() !== '' || rpm.trim() !== '' || targetPower.trim() !== '';
    if (!anyEntered) {
      return { ok: false };
    }

    if ([dispRaw, rpmRaw, veRaw, targetRaw].some((v) => !isFiniteNum(v))) {
      return { ok: false, error: 'Please fill in displacement, RPM, VE, and target power with valid numbers.' };
    }
    if (dispRaw <= 0 || rpmRaw <= 0 || veRaw <= 0 || targetRaw <= 0) {
      return { ok: false, error: 'All numeric inputs must be greater than zero.' };
    }

    const veFrac = veRaw / 100;

    let cid: number;
    let liters: number;
    let unitWarning = '';

    if (unitSystem === 'imperial') {
      cid = dispRaw;
      liters = cid / 61.024;
      if (dispRaw < 15) unitWarning = 'Displacement is very small for CID. Did you mean liters? Try switching to Metric.';
    } else {
      liters = dispRaw;
      cid = liters * 61.024;
    }

    const litersPerTurbo = liters / turboCount;

    const cfmNA = (cid * rpmRaw * veFrac) / 3456;
    const airDensityLbPerFt3 = 0.0765;
    const massFlowNA_lbmin = cfmNA * airDensityLbPerFt3;

    const targetHP = targetRaw;
    const hpPerTurbo = targetHP / turboCount;

    const totalRequiredFlow_lbmin = targetHP / 9.5;

    let prNeeded = 1;
    let boostPsiNeeded = 0;

    if (massFlowNA_lbmin > 0) {
      prNeeded = totalRequiredFlow_lbmin / massFlowNA_lbmin;
      const atmPsi = 14.7;
      boostPsiNeeded = prNeeded * atmPsi - atmPsi;
      if (!isFiniteNum(boostPsiNeeded) || boostPsiNeeded < 0) boostPsiNeeded = 0;
    }

    const hpPerLiter = liters > 0 ? targetHP / liters : NaN;
    const [empLowRatio, empHighRatio] = targetEMPRange(hpPerLiter);

    const empLowPsi = boostPsiNeeded * empLowRatio;
    const empHighPsi = boostPsiNeeded * empHighRatio;

    const compSizeSuggestion = suggestCompressorSize(hpPerTurbo, litersPerTurbo);
    const turbine = suggestTurbineAR(hpPerTurbo, litersPerTurbo, rpmRaw, boostPsiNeeded);

    const boostBarNeeded = boostPsiNeeded / 14.5038;

    const boostText =
      unitSystem === 'metric'
        ? `${formatNumber(boostPsiNeeded, 1)} PSI (approx) / ${formatNumber(boostBarNeeded, 2)} Bar`
        : `${formatNumber(boostPsiNeeded, 1)} PSI (approx)`;

    const empText =
      unitSystem === 'metric'
        ? `${formatNumber(empLowPsi, 1)} – ${formatNumber(empHighPsi, 1)} PSI EMP (${formatNumber(
            empLowPsi / 14.5038,
            2
          )}–${formatNumber(empHighPsi / 14.5038, 2)} Bar) @ power peak`
        : `${formatNumber(empLowPsi, 1)} – ${formatNumber(empHighPsi, 1)} PSI EMP @ power peak`;

    const prWarn =
      prNeeded > 5 ? `Estimated pressure ratio is very high (${formatNumber(prNeeded, 2)}:1). Check units, displacement, and VE – this may be unrealistic.` : '';

    return {
      ok: true,
      unitWarning,
      prWarn,
      boostText,
      prNeeded,
      empText,
      empLowRatio,
      empHighRatio,
      compSizeSuggestion,
      hpPerTurbo,
      turbineAR: turbine.range,
      turbineNote: turbine.note,
    };
  }, [displacement, rpm, ve, targetPower, turboConfig, unitSystem]);

  useEffect(() => {
    if (!calc.ok) {
      setResultsOpacity(0.35);
      return;
    }
    setResultsOpacity(1);
  }, [calc]);

  useEffect(() => {
    clearError();
  }, [unitSystem]);

  function onCalculateClick() {
    clearError();

    if (!calc.ok) {
      const msg = 'error' in calc && calc.error ? calc.error : 'Please fill in the fields with valid numbers.';
      showError(msg);
      setResultsOpacity(0.35);
      return;
    }

    if (calc.unitWarning) {
      showError(calc.unitWarning);
    } else if (calc.prWarn) {
      showError(calc.prWarn);
    } else {
      clearError();
    }

    setResultsOpacity(1);
  }

  return (
    <div className="pageWrap">
      <div className="container">
        <div className="header">
          <div>
            <div className="title">
              <span>HBRacing7</span>
              <span>Turbo Sizing Calculator</span>
            </div>
            <div className="subtitle">
              Enter engine size, RPM, VE, and power goal. The calculator estimates boost pressure, turbine backpressure, and compressor/turbine suggestions.
            </div>
          </div>

          <div className="units-wrapper">
            <div className="units-label">Unit System</div>
            <div className="units-toggle">
              <button type="button" className={unitSystem === 'imperial' ? 'active' : ''} onClick={() => setUnitSystem('imperial')}>
                Imperial
              </button>
              <button type="button" className={unitSystem === 'metric' ? 'active' : ''} onClick={() => setUnitSystem('metric')}>
                Metric
              </button>
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-title">Engine & Power Goal</div>

            <div className="field">
              <label>
                <span>Engine Displacement</span>
                <span>{lblDisplacementUnit}</span>
              </label>
              <input
                value={displacement}
                onChange={(e) => setDisplacement(e.target.value)}
                type="number"
                step="0.01"
                placeholder={displacementPlaceholder}
              />
              <div className="helper">
                {unitSystem === 'imperial'
                  ? 'Imperial: cubic inches (CID). Metric: liters (L).'
                  : 'Metric: liters (L). Imperial: cubic inches (CID).'}
              </div>
            </div>

            <div className="field">
              <label>
                <span>Cylinders</span>
                <span>(count)</span>
              </label>
              <select value={cylinders} onChange={(e) => setCylinders(e.target.value)}>
                <option value="8">V8</option>
                <option value="6">6-cylinder</option>
                <option value="4">4-cylinder</option>
                <option value="other">Other / custom</option>
              </select>
            </div>

            <div className="field">
              <label>
                <span>RPM at Power Peak</span>
                <span>(rpm)</span>
              </label>
              <input value={rpm} onChange={(e) => setRpm(e.target.value)} type="number" step="10" placeholder="6500" />
            </div>

            <div className="field">
              <label>
                <span>Volumetric Efficiency</span>
                <span>(%)</span>
              </label>
              <input value={ve} onChange={(e) => setVe(e.target.value)} type="number" step="1" />
              <div className="helper">Typical: 80–90% mild builds, 90–105% aggressive / race combos.</div>
            </div>

            <div className="field">
              <label>
                <span>Target Power (flywheel)</span>
                <span>(HP)</span>
              </label>
              <input
                value={targetPower}
                onChange={(e) => setTargetPower(e.target.value)}
                type="number"
                step="1"
                placeholder={targetPlaceholder}
              />
              <div className="helper">Total flywheel power goal for the engine (flywheel HP).</div>
            </div>

            <div className="field">
              <label>
                <span>Turbo Configuration</span>
                <span>(per engine)</span>
              </label>
              <select value={turboConfig} onChange={(e) => setTurboConfig(e.target.value as TurboConfig)}>
                <option value="single">Single turbo</option>
                <option value="twin">Twin turbo</option>
              </select>
              <div className="helper">We size per turbo. A twin setup splits airflow across both units.</div>
            </div>

            <div className="actions">
              <button className="btn-main" type="button" onClick={onCalculateClick}>
                Calculate
              </button>
              <button className="btn-ghost" type="button" onClick={resetAll}>
                Reset
              </button>
            </div>

            <div className="error" style={{ display: error ? 'block' : 'none' }}>
              {error}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Turbo Suggestions</div>
            <div className="card-subtitle">
              Boost and turbine pressure are approximations for a well-matched turbo at your goal. Always confirm with manufacturer maps and data.
            </div>

            <div className="results" style={{ opacity: resultsOpacity }}>
              <div>
                <div className="result-label">Approx. Boost Needed to Reach Goal</div>
                <div className="result-value">{calc.ok ? calc.boostText : '–'}</div>
                <div className="chip">
                  Estimated pressure ratio: {calc.ok ? `${formatNumber(calc.prNeeded, 2)} : 1` : '–'}
                </div>
              </div>

              <div>
                <div className="result-label">Target Turbine Backpressure (EMP)</div>
                <div className="result-value">{calc.ok ? calc.empText : '–'}</div>
                <div className="chip">
                  EMP:MAP target ratio: {calc.ok ? `${formatNumber(calc.empLowRatio, 2)}–${formatNumber(calc.empHighRatio, 2)} : 1` : '–'}
                </div>
              </div>

              <div>
                <div className="result-label">Suggested Compressor Size Range</div>
                <div className="result-value">{calc.ok ? calc.compSizeSuggestion : '–'}</div>
                <div className="chip">
                  HP per turbo goal: {calc.ok ? `${formatNumber(calc.hpPerTurbo, 0)} HP` : '–'}
                </div>
              </div>

              <div>
                <div className="result-label">Suggested Turbine Housing A/R</div>
                <div className="result-value">{calc.ok ? calc.turbineAR : '–'}</div>
                <div className="chip">
                  {calc.ok ? calc.turbineNote || 'Adjust toward smaller end for spool, larger end for top end.' : 'Adjust toward smaller end for spool, larger end for top end.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        :root{
          --bg-deep:#050712;
          --panel:rgba(5,9,26,.9);
          --accent-pink:#ff2a6d;
          --accent-purple:#9b4dff;
          --accent-cyan:#00eaff;
          --accent-orange:#ff8a00;
          --text-main:#fdfcff;
          --text-muted:#a1a4c2;
          --border-soft:rgba(144,166,255,.4);
          --danger:#ff7b7b;
        }
        *{box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        /* Keep the neon background scoped so the parent page height stays stable */
        .pageWrap{
          margin:0;
          width:100%;
          color:var(--text-main);
          display:block;
          padding:24px 20px 60px;
          background:radial-gradient(circle at top,#1a1140 0,#050712 55%);
          overflow:hidden;
          position:relative;
          isolation:isolate;
          border-radius:18px;
        }
        .pageWrap::before{
          content:"";position:absolute;inset:-30%;
          background:conic-gradient(from 180deg,#ff2a6d,#ff8a00,#ffd200,#00eaff,#9b4dff,#ff2a6d);
          opacity:.18;filter:blur(40px);animation:spinGradient 26s linear infinite;z-index:-1;
          pointer-events:none;
        }
        @keyframes spinGradient{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        .container{
          position:relative;
          z-index:1;
          width:100%;max-width:980px;
          background:radial-gradient(circle at top left,#1b1433 0,#060716 50%);
          border-radius:20px;padding:22px;
          border:1px solid rgba(0,234,255,.4);
          box-shadow:0 0 30px rgba(0,234,255,.35),0 0 70px rgba(255,42,109,.35);
          margin:0 auto;
        }
        .header{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px}
        .title{display:flex;flex-direction:column;gap:2px}
        .title span:first-child{
          font-size:.8rem;letter-spacing:.3em;color:var(--accent-cyan);text-transform:uppercase
        }
        .title span:last-child{
          font-size:1.6rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
          background:linear-gradient(90deg,var(--accent-pink),var(--accent-orange),var(--accent-cyan));
          -webkit-background-clip:text;background-clip:text;color:transparent
        }
        .subtitle{font-size:.85rem;color:var(--text-muted);margin-top:6px;max-width:460px}
        .units-wrapper{text-align:right}
        .units-label{font-size:.75rem;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.1em}
        .units-toggle{
          display:inline-flex;background:rgba(3,4,18,.85);border-radius:999px;padding:4px;
          border:1px solid rgba(255,255,255,.12);box-shadow:0 0 14px rgba(0,0,0,.8)
        }
        .units-toggle button{
          border:none;background:transparent;color:var(--text-muted);font-size:.8rem;
          padding:6px 14px;border-radius:999px;cursor:pointer;transition:all .18s ease;
          min-width:88px;text-transform:uppercase;letter-spacing:.08em
        }
        .units-toggle button.active{
          background:linear-gradient(135deg,rgba(255,42,109,.95),rgba(0,234,255,.95));
          color:#060716;font-weight:700;
          box-shadow:0 0 12px rgba(0,234,255,.9),0 0 20px rgba(255,42,109,.7)
        }
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:780px){.grid{grid-template-columns:1fr}}
        .card{
          background:
            radial-gradient(circle at top,rgba(255,42,109,.08),transparent 60%),
            radial-gradient(circle at bottom,rgba(0,234,255,.06),transparent 60%),
            var(--panel);
          border-radius:16px;padding:16px;border:1px solid var(--border-soft);
          backdrop-filter:blur(12px);
        }
        .card-title{font-size:.98rem;font-weight:600;margin-bottom:8px}
        .card-subtitle{font-size:.8rem;color:var(--text-muted);margin-bottom:12px}
        .field{margin-bottom:10px}
        .field label{display:flex;justify-content:space-between;align-items:baseline;font-size:.8rem;margin-bottom:4px}
        .field input,.field select{
          width:100%;padding:8px 10px;border-radius:10px;border:1px solid rgba(144,166,255,.7);
          background:radial-gradient(circle at top left,#090b22,#030413);color:var(--text-main);font-size:.86rem
        }
        .field input::placeholder{color:rgba(148,163,186,.65)}
        .helper{font-size:.75rem;color:var(--text-muted);margin-top:2px}
        .actions{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .btn-main{
          border:none;border-radius:999px;padding:9px 20px;
          background:linear-gradient(120deg,var(--accent-pink),var(--accent-orange),var(--accent-cyan));
          color:#060716;font-size:.86rem;font-weight:800;cursor:pointer;
          letter-spacing:.18em;text-transform:uppercase;
          box-shadow:0 0 18px rgba(255,42,109,.9),0 0 26px rgba(0,234,255,.8)
        }
        .btn-ghost{
          border-radius:999px;border:1px solid rgba(148,163,184,.7);
          background:transparent;color:var(--text-muted);padding:9px 18px;font-size:.8rem;
          cursor:pointer;text-transform:uppercase;letter-spacing:.12em
        }
        .results{
          margin-top:6px;font-size:.82rem;display:grid;grid-template-columns:1fr 1fr;
          gap:10px 16px;opacity:.35
        }
        @media(max-width:780px){.results{grid-template-columns:1fr}}
        .result-label{color:var(--text-muted);font-size:.8rem}
        .result-value{font-weight:700;margin-top:2px}
        .chip{
          display:inline-block;padding:4px 9px;border-radius:999px;
          background:linear-gradient(135deg,rgba(0,234,255,.16),rgba(255,42,109,.16));
          border:1px solid rgba(0,234,255,.55);font-size:.74rem;color:var(--accent-cyan);
          margin-top:4px;white-space:normal;line-height:1.25;max-width:100%
        }
        .error{margin-top:8px;color:var(--danger);font-size:.8rem}
      `}</style>
    </div>
  );
}

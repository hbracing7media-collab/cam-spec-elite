'use client';

import { useMemo, useState } from 'react';

type Unit = 'psi' | 'kpa';
type AtmPreset = '14.7' | '13.2' | '12.2' | 'custom';
type EffPreset = '0.80' | '0.85' | '0.90' | '0.95' | 'custom';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString();
}

export default function BoostEstimatorCalculator() {
  const [baseHp, setBaseHp] = useState('');
  const [boost, setBoost] = useState('');
  const [unit, setUnit] = useState<Unit>('psi');

  const [atmPreset, setAtmPreset] = useState<AtmPreset>('14.7');
  const [customAtm, setCustomAtm] = useState('');

  const [eff, setEff] = useState('0.85');
  const [effPreset, setEffPreset] = useState<EffPreset>('0.85');

  const computed = useMemo(() => {
    const base = toNum(baseHp);
    const boostIn = toNum(boost);

    let effN = toNum(eff);
    effN = Number.isFinite(effN) ? clamp(effN, 0.1, 1.15) : 0.85;

    let atmPsi = 14.7;
    if (atmPreset === 'custom') {
      const c = toNum(customAtm);
      atmPsi = Number.isFinite(c) && c > 0 ? c : 14.7;
    } else {
      const a = toNum(atmPreset);
      atmPsi = Number.isFinite(a) && a > 0 ? a : 14.7;
    }

    let boostPsi = NaN;
    if (Number.isFinite(boostIn) && boostIn >= 0) {
      boostPsi = unit === 'psi' ? boostIn : boostIn * 0.1450377377;
    }

    const ok =
      Number.isFinite(base) &&
      base > 0 &&
      Number.isFinite(boostPsi) &&
      boostPsi >= 0 &&
      Number.isFinite(atmPsi) &&
      atmPsi > 0;

    if (!ok) {
      return {
        ok: false as const,
        base,
        boostPsi,
        atmPsi,
        eff: effN,
        pr: NaN,
        mult: NaN,
        newHp: NaN,
        gain: NaN,
      };
    }

    const pr = (atmPsi + boostPsi) / atmPsi;
    const mult = 1 + (pr - 1) * effN;
    const newHp = base * mult;
    const gain = newHp - base;

    return { ok: true as const, base, boostPsi, atmPsi, eff: effN, pr, mult, newHp, gain };
  }, [baseHp, boost, unit, atmPreset, customAtm, eff]);

  function onChangeEffPreset(v: EffPreset) {
    setEffPreset(v);
    if (v !== 'custom') setEff(v);
  }

  return (
    <div id="hb-boosthp-widget">
      <div className="hb-card">
        <div className="hb-title">HP + BOOST → ESTIMATED NEW HP</div>
        <div className="hb-sub">Rule-of-thumb estimate using pressure ratio + efficiency factor (quick bench racing)</div>

        <div className="hb-row">
          <div className="hb-col-6">
            <label className="hb-label">Base horsepower (NA or current HP)</label>
            <input
              className="hb-input"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 450"
              value={baseHp}
              onChange={(e) => setBaseHp(e.target.value)}
            />
          </div>

          <div className="hb-col-6">
            <label className="hb-label">Boost value</label>
            <input
              className="hb-input"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 12"
              value={boost}
              onChange={(e) => setBoost(e.target.value)}
            />
          </div>

          <div className="hb-col-4">
            <label className="hb-label">Boost unit</label>
            <select className="hb-select" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              <option value="psi">PSI</option>
              <option value="kpa">kPa (gauge)</option>
            </select>
          </div>

          <div className="hb-col-4">
            <label className="hb-label">Atmospheric pressure</label>
            <select className="hb-select" value={atmPreset} onChange={(e) => setAtmPreset(e.target.value as AtmPreset)}>
              <option value="14.7">Sea level (14.7 psi)</option>
              <option value="13.2">~5,000 ft (13.2 psi)</option>
              <option value="12.2">~8,000 ft (12.2 psi)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="hb-col-4" style={{ display: atmPreset === 'custom' ? 'block' : 'none' }}>
            <label className="hb-label">Custom atm (psi)</label>
            <input
              className="hb-input"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 14.0"
              value={customAtm}
              onChange={(e) => setCustomAtm(e.target.value)}
            />
          </div>

          <div className="hb-col-8">
            <label className="hb-label">Efficiency / real-world factor (0.70–1.00 typical)</label>
            <input
              className="hb-input"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={eff}
              onChange={(e) => {
                setEff(e.target.value);
                setEffPreset('custom');
              }}
            />
          </div>

          <div className="hb-col-4">
            <label className="hb-label">Fuel / setup preset</label>
            <select className="hb-select" value={effPreset} onChange={(e) => onChangeEffPreset(e.target.value as EffPreset)}>
              <option value="0.80">Pump gas (safe) ~0.80</option>
              <option value="0.85">Intercooled street ~0.85</option>
              <option value="0.90">Good intercooler / E85 ~0.90</option>
              <option value="0.95">Dialed setup ~0.95</option>
              <option value="custom">Custom (use box)</option>
            </select>
          </div>

          <div className="hb-col-12">
            <button className="hb-btn" type="button">
              Calculate
            </button>
          </div>
        </div>

        <div className="hb-results" style={{ display: computed.ok ? 'block' : 'none' }}>
          <div className="hb-grid">
            <div className="hb-metric">
              <div className="k">Estimated New HP</div>
              <div className="v">{computed.ok ? `${fmtInt(computed.newHp)} HP` : '—'}</div>
            </div>

            <div className="hb-metric">
              <div className="k">HP Gain</div>
              <div className="v">{computed.ok ? `+${fmtInt(computed.gain)} HP` : '—'}</div>
            </div>

            <div className="hb-metric">
              <div className="k">Multiplier</div>
              <div className="v">{computed.ok ? `${computed.mult.toFixed(3)}×` : '—'}</div>
            </div>
          </div>

          <div className="hb-note">
            {computed.ok
              ? `Math: PR = (atm + boost) / atm = (${computed.atmPsi.toFixed(2)} + ${computed.boostPsi.toFixed(2)}) / ${computed.atmPsi.toFixed(2)} = ${computed.pr.toFixed(3)}. Applied efficiency factor: ${computed.eff.toFixed(2)}. This is a rule-of-thumb estimate (real results depend on turbo/SC efficiency, timing, AFR, temps, backpressure, and fuel).`
              : ''}
          </div>
        </div>
      </div>

      <style>{`
        #hb-boosthp-widget{
          max-width: 980px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #e5e7eb;
          padding: 18px;
        }
        .hb-card{
          background: radial-gradient(circle at top left, #071226, #020617);
          border: 1px solid rgba(56,189,248,0.35);
          border-radius: 18px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.65);
          padding: 18px;
        }
        .hb-title{
          margin: 0 0 6px 0;
          text-align: center;
          font-size: 16px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7dd3fc;
          font-weight: 800;
        }
        .hb-sub{
          margin: 0 0 14px 0;
          text-align: center;
          font-size: 12px;
          color: rgba(203,213,225,0.9);
        }
        .hb-row{
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 12px;
          margin-top: 12px;
        }
        .hb-col-6{ grid-column: span 6; }
        .hb-col-4{ grid-column: span 4; }
        .hb-col-8{ grid-column: span 8; }
        .hb-col-12{ grid-column: span 12; }
        @media (max-width: 720px){ .hb-col-6,.hb-col-4,.hb-col-8{ grid-column: span 12; } }
        .hb-label{
          display:block;
          font-size: 11px;
          color: rgba(203,213,225,0.9);
          margin: 0 0 6px 0;
        }
        .hb-input, .hb-select{
          width: 100%;
          box-sizing: border-box;
          border-radius: 12px;
          border: 1px solid rgba(147,197,253,0.22);
          background: rgba(2,6,23,0.72);
          color: #e5e7eb;
          padding: 10px 12px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
          font-size: 14px;
        }
        .hb-input:focus, .hb-select:focus{
          border-color: rgba(56,189,248,0.75);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.18);
        }
        .hb-btn{
          width: 100%;
          border: 0;
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #001018;
          background: linear-gradient(90deg, rgba(34,211,238,0.95), rgba(244,114,182,0.95), rgba(167,139,250,0.95));
          box-shadow: 0 12px 26px rgba(0,0,0,0.55);
        }
        .hb-btn:active{ transform: translateY(1px); }
        .hb-results{
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(244,114,182,0.28);
          background: linear-gradient(180deg, rgba(15,23,42,0.65), rgba(2,6,23,0.75));
        }
        .hb-grid{
          display:grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 10px;
        }
        .hb-metric{
          grid-column: span 4;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(34,211,238,0.20);
          background: rgba(2,6,23,0.55);
        }
        @media (max-width: 720px){ .hb-metric{ grid-column: span 12; } }
        .hb-metric .k{ font-size: 11px; color: rgba(203,213,225,0.9); margin-bottom: 6px; }
        .hb-metric .v{ font-size: 20px; font-weight: 900; color: #e5e7eb; }
        .hb-note{
          margin-top: 10px;
          font-size: 11px;
          color: rgba(203,213,225,0.85);
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}

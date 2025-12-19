'use client';

import { useMemo, useState } from "react";

type Units = "imperial" | "metric";
type Mode = "speedAtRpm" | "rpmAtSpeed";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function n2(x: number) {
  return Number.isFinite(x) ? x.toFixed(2) : "—";
}
function n0(x: number) {
  return Number.isFinite(x) ? Math.round(x).toString() : "—";
}

function _toggle(x: number) {
  return !(x > 0);
}

function mphFromRpm(rpm: number, tireDiaIn: number, gear: number, axle: number) {
  if (!(rpm > 0) || _toggle(gear) || !(axle > 0) || !(tireDiaIn > 0)) return NaN;
  return (rpm * tireDiaIn) / (gear * axle * 336);
}

function rpmFromMph(mph: number, tireDiaIn: number, gear: number, axle: number) {
  if (!(mph >= 0) || !(gear > 0) || !(axle > 0) || !(tireDiaIn > 0)) return NaN;
  return (mph * gear * axle * 336) / tireDiaIn;
}

export default function GearRatioCalculator() {
  const [units, setUnits] = useState<Units>("imperial");
  const [mode, setMode] = useState<Mode>("speedAtRpm");
  const [axleRatio, setAxleRatio] = useState<string>("3.73");
  const [tireDiaIn, setTireDiaIn] = useState<string>("28");
  const [tireDiaMm, setTireDiaMm] = useState<string>("711");
  const [targetRpm, setTargetRpm] = useState<string>("2000");
  const [targetSpeedMph, setTargetSpeedMph] = useState<string>("60");
  const [targetSpeedKph, setTargetSpeedKph] = useState<string>("96.56");
  const [gears, setGears] = useState<string[]>(["4.70", "2.98", "2.15", "1.77", "1.52", "1.28", "1.00", "0.85", "0.69", "0.63"]);

  function toMetric() {
    setUnits("metric");
    const inVal = Number(tireDiaIn);
    if (inVal > 0) setTireDiaMm(n0(inVal * 25.4));
    const mph = Number(targetSpeedMph);
    if (mph >= 0) setTargetSpeedKph(n2(mph * 1.609344));
  }

  function toImperial() {
    setUnits("imperial");
    const mmVal = Number(tireDiaMm);
    if (mmVal > 0) setTireDiaIn(n2(mmVal / 25.4));
    const kph = Number(targetSpeedKph);
    if (kph >= 0) setTargetSpeedMph(n2(kph / 1.609344));
  }

  const parsed = useMemo(() => {
    const axle = Number(axleRatio);

    const tireIn =
      units === "imperial"
        ? Number(tireDiaIn)
        : Number(tireDiaMm) > 0
        ? Number(tireDiaMm) / 25.4
        : NaN;

    const rpm = Number(targetRpm);
    const mph =
      units === "imperial"
        ? Number(targetSpeedMph)
        : Number(targetSpeedKph) > 0
        ? Number(targetSpeedKph) / 1.609344
        : NaN;

    const gearNums = gears.map((g) => Number(g));

    return { axle, tireIn, rpm, mph, gearNums };
  }, [axleRatio, tireDiaIn, tireDiaMm, targetRpm, targetSpeedMph, targetSpeedKph, gears, units]);

  const rows = useMemo(() => {
    const { axle, tireIn, rpm, mph, gearNums } = parsed;

    return gearNums.map((gr, idx) => {
      const gearLabel = `Gear ${idx + 1}`;
      const speedMph = mphFromRpm(rpm, tireIn, gr, axle);
      const speedKph = speedMph * 1.609344;
      const rpmAtMph = rpmFromMph(mph, tireIn, gr, axle);

      return { gearLabel, gr, speedMph, speedKph, rpmAtMph };
    });
  }, [parsed]);

  const issues = useMemo(() => {
    const out: string[] = [];
    const { axle, tireIn, rpm, mph, gearNums } = parsed;

    if (!(axle > 0)) out.push("Axle ratio must be > 0.");
    if (!(tireIn > 0)) out.push("Tire diameter must be > 0.");
    if (mode === "speedAtRpm" && !(rpm > 0)) out.push("Target RPM must be > 0.");
    if (mode === "rpmAtSpeed" && !(mph >= 0)) out.push("Target speed must be 0 or higher.");

    gearNums.forEach((g, i) => {
      if (!(g > 0)) out.push(`Gear ${i + 1} ratio must be > 0.`);
    });

    return out;
  }, [parsed, mode]);

  return (
    <div className="wrap">
      <div className="card">
        <div className="head">
          <div className="badge">HB Racing 7</div>
          <div className="title">10-Speed Transmission Ratio / RPM Calculator</div>
          <div className="sub">Enter axle ratio, tire diameter, and up to 10 gear ratios. Then calculate road speed at RPM or RPM at road speed.</div>
        </div>

        <div className="toprow">
          <div className="field">
            <label className="label">Units</label>
            <div className="toggle">
              <button type="button" className={`tbtn ${units === "imperial" ? "on" : ""}`} onClick={toImperial}>
                Imperial (MPH / Inches)
              </button>
              <button type="button" className={`tbtn ${units === "metric" ? "on" : ""}`} onClick={toMetric}>
                Metric (km/h / mm)
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label">Mode</label>
            <div className="toggle">
              <button type="button" className={`tbtn ${mode === "speedAtRpm" ? "on" : ""}`} onClick={() => setMode("speedAtRpm")}>
                Speed at RPM
              </button>
              <button type="button" className={`tbtn ${mode === "rpmAtSpeed" ? "on" : ""}`} onClick={() => setMode("rpmAtSpeed")}>
                RPM at Speed
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label">Axle (Final Drive) Ratio</label>
            <input className="input" type="number" step="0.01" inputMode="decimal" value={axleRatio} onChange={(e) => setAxleRatio(e.target.value)} placeholder="e.g. 3.73" />
          </div>

          {units === "imperial" ? (
            <div className="field">
              <label className="label">Tire Diameter (in)</label>
              <input className="input" type="number" step="0.01" inputMode="decimal" value={tireDiaIn} onChange={(e) => setTireDiaIn(e.target.value)} placeholder="e.g. 28" />
            </div>
          ) : (
            <div className="field">
              <label className="label">Tire Diameter (mm)</label>
              <input className="input" type="number" step="1" inputMode="numeric" value={tireDiaMm} onChange={(e) => setTireDiaMm(e.target.value)} placeholder="e.g. 711" />
            </div>
          )}
        </div>

        <div className="grid">
          {mode === "speedAtRpm" ? (
            <div className="field">
              <label className="label">Target Engine RPM</label>
              <input className="input" type="number" step="1" inputMode="numeric" value={targetRpm} onChange={(e) => setTargetRpm(e.target.value)} placeholder="e.g. 2000" />
            </div>
          ) : (
            <div className="field">
              <label className="label">Target Road Speed ({units === "imperial" ? "MPH" : "km/h"})</label>
              {units === "imperial" ? (
                <input className="input" type="number" step="0.1" inputMode="decimal" value={targetSpeedMph} onChange={(e) => setTargetSpeedMph(e.target.value)} placeholder="e.g. 60" />
              ) : (
                <input className="input" type="number" step="0.1" inputMode="decimal" value={targetSpeedKph} onChange={(e) => setTargetSpeedKph(e.target.value)} placeholder="e.g. 96.6" />
              )}
            </div>
          )}

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Gear Ratios (10-speed)</label>
            <div className="gearGrid">
              {gears.map((g, i) => (
                <div key={i} className="gearBox">
                  <div className="gearLabel">G{i + 1}</div>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                    value={g}
                    onChange={(e) => {
                      const next = gears.slice();
                      next[i] = e.target.value;
                      setGears(next);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="hint">Tip: put your transmission ratios in order (1st → 10th). You can overwrite any gear.</div>
          </div>
        </div>

        {issues.length > 0 ? (
          <div className="status err">
            {issues.map((x, i) => (
              <div key={i}>• {x}</div>
            ))}
          </div>
        ) : (
          <div className="status ok">Live results below. (Math updates instantly)</div>
        )}

        <div className="results">
          <div className="resultsHead">
            <div className="resultsTitle">Results</div>
            <div className="resultsNote">
              {mode === "speedAtRpm"
                ? `Speed at ${targetRpm || "—"} RPM`
                : `RPM at ${units === "imperial" ? (targetSpeedMph || "—") + " MPH" : (targetSpeedKph || "—") + " km/h"}`}
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Gear</th>
                  <th>Gear Ratio</th>
                  {mode === "speedAtRpm" ? (
                    <>
                      <th>Speed (MPH)</th>
                      <th>Speed (km/h)</th>
                    </>
                  ) : (
                    <>
                      <th>RPM @ Speed</th>
                      <th>Wheel RPM (est)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const wheelRpm =
                    parsed.rpm > 0 && r.gr > 0 && parsed.axle > 0
                      ? parsed.rpm / (r.gr * parsed.axle)
                      : parsed.mph >= 0 && r.gr > 0 && parsed.axle > 0
                      ? r.rpmAtMph / (r.gr * parsed.axle)
                      : NaN;

                  return (
                    <tr key={idx}>
                      <td>{r.gearLabel}</td>
                      <td>{n2(r.gr)}</td>

                      {mode === "speedAtRpm" ? (
                        <>
                          <td>{n2(r.speedMph)}</td>
                          <td>{n2(r.speedKph)}</td>
                        </>
                      ) : (
                        <>
                          <td>{n0(r.rpmAtMph)}</td>
                          <td>{n0(wheelRpm)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="foot">
            Formulas: <b>MPH = RPM × TireDia(in) ÷ (Gear × Axle × 336)</b> and <b>RPM = MPH × Gear × Axle × 336 ÷ TireDia(in)</b>.
          </div>
        </div>
      </div>

      <style>{`
        .wrap{max-width:1100px;margin:0 auto;padding:18px}
        .card{
          border-radius:18px;padding:18px;
          background:
            radial-gradient(900px 420px at 15% 10%, rgba(34,211,238,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(800px 380px at 85% 15%, rgba(244,114,182,0.22), rgba(0,0,0,0) 55%),
            radial-gradient(900px 520px at 50% 105%, rgba(168,85,247,0.18), rgba(0,0,0,0) 60%),
            linear-gradient(180deg,#050816,#020617);
          border:1px solid rgba(56,189,248,0.35);
          box-shadow:0 18px 46px rgba(0,0,0,0.65);
          color:#eaf2ff;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }
        .head{text-align:center;padding-bottom:8px}
        .badge{
          display:inline-block;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;
          padding:6px 10px;border-radius:999px;border:1px solid rgba(56,189,248,0.55);
          background:rgba(56,189,248,0.08);color:#7dd3fc;margin-bottom:10px;
        }
        .title{font-size:22px;font-weight:950;letter-spacing:.06em}
        .sub{font-size:12px;color:rgba(203,213,255,0.88);margin-top:6px}

        .toprow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}
        @media (max-width:980px){.toprow{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:560px){.toprow{grid-template-columns:1fr}}

        .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px}
        @media (max-width:980px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:560px){.grid{grid-template-columns:1fr}}

        .field{display:flex;flex-direction:column;gap:6px;min-width:0}
        .label{font-size:11px;color:rgba(203,213,255,0.92);letter-spacing:.06em;text-transform:uppercase}
        .input{
          width:100%;border-radius:12px;padding:10px 11px;
          border:1px solid rgba(56,189,248,0.28);background:rgba(2,6,23,0.72);
          color:#eaf2ff;outline:none
        }
        .input:focus{border-color:rgba(244,114,182,0.65);box-shadow:0 0 0 3px rgba(244,114,182,0.18)}

        .toggle{display:flex;gap:10px}
        .tbtn{
          flex:1;border:1px solid rgba(56,189,248,0.28);background:rgba(2,6,23,0.6);color:#eaf2ff;
          padding:10px 12px;border-radius:12px;font-weight:900;letter-spacing:.04em;cursor:pointer
        }
        .tbtn.on{
          border:1px solid rgba(34,211,238,0.55);
          background:linear-gradient(90deg, rgba(34,211,238,0.22), rgba(244,114,182,0.18), rgba(168,85,247,0.18));
        }

        .gearGrid{
          display:grid;
          grid-template-columns:repeat(10,minmax(0,1fr));
          gap:10px;
          margin-top:8px;
        }
        @media (max-width:1100px){.gearGrid{grid-template-columns:repeat(5,minmax(0,1fr))}}
        @media (max-width:640px){.gearGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        .gearBox{display:flex;flex-direction:column;gap:6px}
        .gearLabel{font-size:11px;font-weight:900;color:#7dd3fc;letter-spacing:.08em}

        .hint{margin-top:8px;font-size:12px;color:rgba(203,213,255,0.88)}

        .status{
          margin-top:12px;border-radius:14px;padding:10px 12px;
          border:1px solid rgba(56,189,248,0.22);
          background:rgba(2,6,23,0.45);
          font-size:12px;color:rgba(203,213,255,0.92)
        }
        .status.err{border-color:rgba(248,113,113,0.55);background:rgba(248,113,113,0.10)}
        .status.ok{border-color:rgba(34,211,238,0.45);background:rgba(34,211,238,0.08)}

        .results{margin-top:14px}
        .resultsHead{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;margin-bottom:10px}
        .resultsTitle{font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#7dd3fc}
        .resultsNote{font-size:12px;color:rgba(203,213,255,0.88)}

        .tableWrap{
          border-radius:16px;
          border:1px solid rgba(56,189,248,0.24);
          background:rgba(2,6,23,0.55);
          overflow:hidden;
        }
        .table{
          width:100%;
          border-collapse:collapse;
        }
        th,td{
          padding:10px 12px;
          border-bottom:1px solid rgba(56,189,248,0.14);
          text-align:left;
          font-size:13px;
          white-space:nowrap;
        }
        th{
          font-size:12px;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:rgba(203,213,255,0.92);
          background:rgba(255,255,255,0.04);
        }
        tr:last-child td{border-bottom:none}

        .foot{margin-top:10px;font-size:11px;color:rgba(203,213,255,0.78);text-align:center}
      `}</style>
    </div>
  );
}

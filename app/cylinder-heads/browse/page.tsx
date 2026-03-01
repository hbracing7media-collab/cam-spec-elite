"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type CylinderHead = {
  id: string;
  brand: string;
  part_number: string;
  engine_make: string;
  engine_family: string;
  intake_valve_size: string;
  exhaust_valve_size: string;
  max_lift: string;
  max_rpm: string;
  intake_runner_cc: string;
  chamber_cc: string;
  flow_data: Array<{ lift: string; intakeFlow: string; exhaustFlow: string }>;
  notes: string;
};

// Smooth interpolation using cubic spline
function interpolateFlow(data: Array<{ lift: number; flow: number }>, x: number): number {
  if (data.length === 0) return 0;
  if (x <= data[0].lift) return data[0].flow;
  if (x >= data[data.length - 1].lift) return data[data.length - 1].flow;

  let i = 0;
  for (i = 0; i < data.length - 1; i++) {
    if (x >= data[i].lift && x <= data[i + 1].lift) break;
  }

  const x0 = data[i].lift;
  const y0 = data[i].flow;
  const x1 = data[i + 1].lift;
  const y1 = data[i + 1].flow;

  // Linear interpolation for simplicity (can use cubic spline if needed)
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function FlowGraph({ head }: { head: CylinderHead }) {
  const flowData = head.flow_data
    .map(d => ({ lift: parseFloat(d.lift), intakeFlow: parseFloat(d.intakeFlow), exhaustFlow: parseFloat(d.exhaustFlow) }))
    .sort((a, b) => a.lift - b.lift);

  if (flowData.length === 0) return null;

  const intakeData = flowData.map(d => ({ lift: d.lift, flow: d.intakeFlow }));
  const exhaustData = flowData.map(d => ({ lift: d.lift, flow: d.exhaustFlow }));

  const minLift = flowData[0].lift;
  const maxLift = parseFloat(head.max_lift);
  const maxFlow = Math.max(...flowData.flatMap(d => [d.intakeFlow, d.exhaustFlow])) * 1.1;

  const width = 600;
  const height = 300;
  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  // Generate smooth curves
  const intakePath = [];
  const exhaustPath = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const lift = minLift + ((maxLift - minLift) * i) / steps;
    const intakeFlow = interpolateFlow(intakeData, lift);
    const exhaustFlow = interpolateFlow(exhaustData, lift);

    const x = padding + ((lift - minLift) / (maxLift - minLift)) * graphWidth;
    const yInt = padding + graphHeight - (intakeFlow / maxFlow) * graphHeight;
    const yExh = padding + graphHeight - (exhaustFlow / maxFlow) * graphHeight;

    if (i === 0) {
      intakePath.push(`M ${x} ${yInt}`);
      exhaustPath.push(`M ${x} ${yExh}`);
    } else {
      intakePath.push(`L ${x} ${yInt}`);
      exhaustPath.push(`L ${x} ${yExh}`);
    }
  }

  return (
    <svg width={width} height={height} style={{ marginTop: 12, border: "1px solid rgba(56,189,248,0.35)", borderRadius: 8 }}>
      {/* Grid */}
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d={`M 60 0 L 0 0 0 60`} fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x={padding} y={padding} width={graphWidth} height={graphHeight} fill="url(#grid)" />

      {/* Axes */}
      <line x1={padding} y1={padding + graphHeight} x2={padding + graphWidth} y2={padding + graphHeight} stroke="#7dd3fc" strokeWidth="2" />
      <line x1={padding} y1={padding} x2={padding} y2={padding + graphHeight} stroke="#7dd3fc" strokeWidth="2" />

      {/* Grid labels - Lift (X-axis) */}
      {[0, 0.2, 0.4, 0.6].map((liftVal) => {
        if (liftVal > maxLift) return null;
        const x = padding + ((liftVal - minLift) / (maxLift - minLift)) * graphWidth;
        return (
          <g key={`lift-${liftVal}`}>
            <line x1={x} y1={padding + graphHeight} x2={x} y2={padding + graphHeight + 4} stroke="#7dd3fc" strokeWidth="1" />
            <text x={x} y={padding + graphHeight + 16} textAnchor="middle" fontSize="12" fill="#cbd5f5">
              {liftVal.toFixed(2)}"
            </text>
          </g>
        );
      })}

      {/* Grid labels - Flow (Y-axis) */}
      {[0, 100, 200, 300, 400].map((flowVal) => {
        if (flowVal > maxFlow) return null;
        const y = padding + graphHeight - (flowVal / maxFlow) * graphHeight;
        return (
          <g key={`flow-${flowVal}`}>
            <line x1={padding - 4} y1={y} x2={padding} y2={y} stroke="#7dd3fc" strokeWidth="1" />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#cbd5f5">
              {flowVal}
            </text>
          </g>
        );
      })}

      {/* Curves */}
      <path d={intakePath.join(" ")} fill="none" stroke="#86efac" strokeWidth="2" />
      <path d={exhaustPath.join(" ")} fill="none" stroke="#fca5a5" strokeWidth="2" />

      {/* Legend */}
      <circle cx={width - 120} cy={padding + 10} r="3" fill="#86efac" />
      <text x={width - 110} y={padding + 14} fontSize="12" fill="#e5e7eb">
        Intake
      </text>

      <circle cx={width - 120} cy={padding + 30} r="3" fill="#fca5a5" />
      <text x={width - 110} y={padding + 34} fontSize="12" fill="#e5e7eb">
        Exhaust
      </text>

      {/* Labels */}
      <text x={padding + graphWidth / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#cbd5f5">
        Lift (inches)
      </text>
      <text x={20} y={padding + graphHeight / 2} textAnchor="middle" fontSize="12" fill="#cbd5f5" transform={`rotate(-90, 20, ${padding + graphHeight / 2})`}>
        Flow (CFM)
      </text>
    </svg>
  );
}

export default function CylinderHeadsBrowse() {
  const t = useTranslations();
  const [heads, setHeads] = useState<CylinderHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [makes, setMakes] = useState<string[]>([]);
  const [families, setFamilies] = useState<string[]>([]);

  useEffect(() => {
    loadHeads();
  }, []);

  async function loadHeads() {
    try {
      const res = await fetch("/api/cylinder-heads/browse");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setHeads(data.heads || []);

      // Extract unique makes
      const uniqueMakes = [...new Set(data.heads.map((h: CylinderHead) => h.engine_make))].sort() as string[];
      setMakes(uniqueMakes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedMake) {
      const uniqueFamilies = [...new Set(heads.filter(h => h.engine_make === selectedMake).map(h => h.engine_family))].sort();
      setFamilies(uniqueFamilies);
      setSelectedFamily("");
    }
  }, [selectedMake, heads]);

  const filteredHeads = heads.filter(h => {
    if (selectedMake && h.engine_make !== selectedMake) return false;
    if (selectedFamily && h.engine_family !== selectedFamily) return false;
    return true;
  });

  if (loading) return <div style={{ padding: 20 }}>{t("common.loading")}</div>;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 20, color: "#e5e7eb", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#d8b4fe", marginBottom: 12 }}>{t("heads.databaseTitle")}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, color: "#cbd5f5" }}>
            Engine Make
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(2,6,23,0.55)",
                color: "#e5e7eb",
              }}
            >
              <option value="">All Makes</option>
              {makes.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedMake && (
          <div>
            <label style={{ fontSize: 12, color: "#cbd5f5" }}>
              Engine Family
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(56,189,248,0.35)",
                  background: "rgba(2,6,23,0.55)",
                  color: "#e5e7eb",
                }}
              >
                <option value="">All Families</option>
                {families.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {filteredHeads.length === 0 ? (
          <p>No cylinder heads found.</p>
        ) : (
          filteredHeads.map(head => (
            <div key={head.id} style={{ background: "rgba(2,6,23,0.55)", padding: 20, borderRadius: 12, border: "1px solid rgba(56,189,248,0.35)" }}>
              <h2 style={{ margin: "0 0 12px 0", color: "#7dd3fc" }}>
                {head.brand} {head.part_number}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <strong>Engine:</strong>
                  <div>{head.engine_make}</div>
                  <div style={{ fontSize: 12, color: "#cbd5f5" }}>{head.engine_family}</div>
                </div>
                <div>
                  <strong>Valves:</strong>
                  <div>Intake: {head.intake_valve_size}mm</div>
                  <div>Exhaust: {head.exhaust_valve_size}mm</div>
                </div>
                <div>
                  <strong>Specs:</strong>
                  <div>Max Lift: {head.max_lift}"</div>
                  <div>Max RPM: {head.max_rpm}</div>
                </div>
                <div>
                  <strong>Chambers:</strong>
                  <div>Runner: {head.intake_runner_cc}cc</div>
                  <div>Chamber: {head.chamber_cc}cc</div>
                </div>
              </div>

              {/* Flow Graph */}
              <FlowGraph head={head} />

              {/* Flow Data Table */}
              <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.35)" }}>
                    <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Lift (in)</th>
                    <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Intake (CFM)</th>
                    <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Exhaust (CFM)</th>
                  </tr>
                </thead>
                <tbody>
                  {head.flow_data.map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(56,189,248,0.18)" }}>
                      <td style={{ padding: 8 }}>{point.lift}</td>
                      <td style={{ padding: 8 }}>{point.intakeFlow}</td>
                      <td style={{ padding: 8 }}>{point.exhaustFlow}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {head.notes && (
                <div style={{ marginTop: 12 }}>
                  <strong>Notes:</strong>
                  <p style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 12, color: "#cbd5f5" }}>{head.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Link href="/cylinder-heads/submit" style={{ display: "inline-block", marginTop: 20, padding: "10px 16px", background: "rgba(56,189,248,0.18)", border: "1px solid rgba(56,189,248,0.35)", borderRadius: 8, color: "#7dd3fc", textDecoration: "none" }}>
        Submit Your Cylinder Head
      </Link>
    </main>
  );
}

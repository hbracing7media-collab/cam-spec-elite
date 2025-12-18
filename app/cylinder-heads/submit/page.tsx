"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseInstance } from "../../../lib/supabaseSingleton";

function useAuthCheck() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setIsAuthed(true);
      }
    };
    checkAuth();
  }, [router]);

  return isAuthed;
}

type MakeKey =
  | "Ford" | "GM" | "Mopar" | "Toyota" | "Honda" | "Nissan" | "Mazda"
  | "Subaru" | "Mitsubishi" | "VW/Audi" | "BMW" | "Mercedes" | "Hyundai/Kia" | "Other";

const ENGINE_FAMILIES: Record<MakeKey, string[]> = {
  Ford: ["Small Block Windsor", "Small Block Cleveland", "Modular 4.6/5.4", "Coyote 5.0", "Godzilla 7.3", "FE Big Block", "385 Series (429/460)", "EcoBoost 2.3", "EcoBoost 2.7/3.0/3.5"],
  GM: ["LS (Gen III/IV)", "LT (Gen V)", "Small Block Chevy (SBC)", "Big Block Chevy (BBC)", "Gen I/II LT1/LT4 (90s)", "Ecotec", "Duramax"],
  Mopar: ["Gen III HEMI (5.7/6.1/6.4)", "Hellcat 6.2", "LA Small Block", "Magnum Small Block", "B/RB Big Block", "Slant-6"],
  Toyota: ["2JZ", "1JZ", "3S", "1UZ/3UZ", "2UZ", "GR (3.5/4.0/4.3)"],
  Honda: ["B-Series", "K-Series", "D-Series", "H/F-Series", "J-Series"],
  Nissan: ["SR20", "RB (RB20/25/26)", "VQ (VQ35/37)", "VR30", "KA24"],
  Mazda: ["BP", "13B Rotary", "MZR/Duratec", "Skyactiv"],
  Subaru: ["EJ", "FA/FB"],
  Mitsubishi: ["4G63", "4B11"],
  "VW/Audi": ["1.8T", "2.0T EA888", "VR6", "5-Cyl (07K)", "Audi V6T/V8"],
  BMW: ["N54", "N55", "B58", "S55", "S58"],
  Mercedes: ["M113", "M156", "M157", "M177/M178", "OM606"],
  "Hyundai/Kia": ["Theta II 2.0T", "Lambda V6", "Smartstream"],
  Other: ["Other/Custom"],
};

type FlowDataPoint = {
  lift: string;
  intakeFlow: string;
  exhaustFlow: string;
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: "#cbd5f5" };
const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(2,6,23,0.55)",
  color: "#e5e7eb",
  outline: "none",
};

export default function CylinderHeadSubmitPage(): React.JSX.Element {
  const isAuthed = useAuthCheck();
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [engineMake, setEngineMake] = useState<MakeKey>("Ford");
  const [engineFamily, setEngineFamily] = useState<string>(ENGINE_FAMILIES.Ford[0] ?? "");

  const [intakeValveSize, setIntakeValveSize] = useState("");
  const [exhaustValveSize, setExhaustValveSize] = useState("");
  const [maxLift, setMaxLift] = useState("");
  const [maxRpm, setMaxRpm] = useState("");
  const [intakeRunnerCc, setIntakeRunnerCc] = useState("");
  const [chamberCc, setChamberCc] = useState("");

  const [flowData, setFlowData] = useState<FlowDataPoint[]>([
    { lift: "", intakeFlow: "", exhaustFlow: "" },
  ]);

  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fam = ENGINE_FAMILIES[engineMake];
    setEngineFamily(fam?.[0] ?? "");
  }, [engineMake]);

  useEffect(() => {
    const init = async () => {
      try {
        // Use the /api/auth/me endpoint which reads cookies server-side
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.id) {
            console.log("Got user from /api/auth/me:", meData.user.id);
            setUserId(meData.user.id);
          }
        } else {
          console.log("Not authenticated via /api/auth/me");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };

    void init();
  }, []);

  const families = ENGINE_FAMILIES[engineMake] ?? [];

  function addFlowDataRow() {
    setFlowData([...flowData, { lift: "", intakeFlow: "", exhaustFlow: "" }]);
  }

  function removeFlowDataRow(index: number) {
    setFlowData(flowData.filter((_, i) => i !== index));
  }

  function updateFlowDataRow(index: number, field: keyof FlowDataPoint, value: string) {
    const updated = [...flowData];
    updated[index] = { ...updated[index], [field]: value };
    setFlowData(updated);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    // Validation
    if (!brand.trim()) { setMsg("Brand is required"); return; }
    if (!partNumber.trim()) { setMsg("Part number is required"); return; }
    if (!partName.trim()) { setMsg("Part name is required"); return; }
    if (!intakeValveSize.trim()) { setMsg("Intake valve size is required"); return; }
    if (!exhaustValveSize.trim()) { setMsg("Exhaust valve size is required"); return; }
    if (!maxLift.trim()) { setMsg("Max lift is required"); return; }
    if (!maxRpm.trim()) { setMsg("Max RPM is required"); return; }
    if (!intakeRunnerCc.trim()) { setMsg("Intake runner CC is required"); return; }
    if (!chamberCc.trim()) { setMsg("Chamber CC is required"); return; }
    
    // Validate flow data
    const validFlowData = flowData.filter(d => d.lift.trim() || d.intakeFlow.trim() || d.exhaustFlow.trim());
    if (validFlowData.length === 0) { setMsg("At least one flow data point is required"); return; }
    for (const fd of validFlowData) {
      if (!fd.lift.trim() || !fd.intakeFlow.trim() || !fd.exhaustFlow.trim()) {
        setMsg("All flow data fields must be filled");
        return;
      }
    }

    if (!userId) { 
      setMsg("Waiting for user session..."); 
      return; 
    }

    setLoading(true);

    try {
      const payload = {
        user_id: userId,
        brand,
        part_number: partNumber,
        part_name: partName,
        engine_make: engineMake,
        engine_family: engineFamily,
        intake_valve_size: intakeValveSize,
        exhaust_valve_size: exhaustValveSize,
        max_lift: maxLift,
        max_rpm: maxRpm,
        intake_runner_cc: intakeRunnerCc,
        chamber_cc: chamberCc,
        flow_data: validFlowData,
        notes,
      };

      const res = await fetch("/api/cylinder-heads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Submit response:", res.status, data);

      if (!res.ok) {
        setMsg(data.message || "Submission failed");
        return;
      }

      // Reset form
      setBrand("");
      setPartNumber("");
      setPartName("");
      setEngineFamily(ENGINE_FAMILIES.Ford[0] ?? "");
      setIntakeValveSize("");
      setExhaustValveSize("");
      setMaxLift("");
      setMaxRpm("");
      setIntakeRunnerCc("");
      setChamberCc("");
      setFlowData([{ lift: "", intakeFlow: "", exhaustFlow: "" }]);
      setNotes("");

      setMsg("Submitted for approval ✅");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthed) return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16, color: "#e5e7eb", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <div style={{ borderRadius: 18, padding: 18, background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), rgba(2,6,23,0.92))", border: "1px solid rgba(56,189,248,0.35)", boxShadow: "0 18px 46px rgba(0,0,0,0.65)" }}>
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 16, color: "#7dd3fc", textAlign: "center" }}>
          Cylinder Head Submission
        </h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Brand (required)
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g., AFR, Edelbrock, Trick Flow" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Part Number (required)
                <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g., 1067, RPM-R, TFS-51410101" style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Part Name (required)
                <input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g., 185cc Intake, Ported Heads" style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Engine Make (required)
                <select value={engineMake} onChange={(e) => setEngineMake(e.target.value as MakeKey)} style={inputStyle}>
                  {(Object.keys(ENGINE_FAMILIES) as MakeKey[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Engine Family (required)
                <select value={engineFamily} onChange={(e) => setEngineFamily(e.target.value)} style={inputStyle}>
                  {families.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Intake Valve Size (mm, required)
                <input value={intakeValveSize} onChange={(e) => setIntakeValveSize(e.target.value)} placeholder="e.g., 2.160" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Exhaust Valve Size (mm, required)
                <input value={exhaustValveSize} onChange={(e) => setExhaustValveSize(e.target.value)} placeholder="e.g., 1.600" style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Max Lift (inches, required)
                <input value={maxLift} onChange={(e) => setMaxLift(e.target.value)} placeholder="e.g., 0.600" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Max RPM (required)
                <input value={maxRpm} onChange={(e) => setMaxRpm(e.target.value)} placeholder="e.g., 7000" style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Intake Runner CC (required)
                <input value={intakeRunnerCc} onChange={(e) => setIntakeRunnerCc(e.target.value)} placeholder="e.g., 210" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Combustion Chamber CC (required)
                <input value={chamberCc} onChange={(e) => setChamberCc(e.target.value)} placeholder="e.g., 65" style={inputStyle} />
              </label>
            </div>

            {/* Flow Data Table */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#cbd5f5", fontWeight: 600, marginBottom: 12 }}>
                Flow Data (Lift vs CFM) - Required
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.35)" }}>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>Lift (in)</th>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>Intake Flow (CFM)</th>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>Exhaust Flow (CFM)</th>
                      <th style={{ padding: "8px 4px", width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {flowData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(56,189,248,0.18)" }}>
                        <td style={{ padding: "8px 4px" }}>
                          <input
                            type="number"
                            step="0.001"
                            value={row.lift}
                            onChange={(e) => updateFlowDataRow(idx, "lift", e.target.value)}
                            placeholder="0.100"
                            style={{ ...inputStyle, marginTop: 0, padding: "6px 8px", width: "90%" }}
                          />
                        </td>
                        <td style={{ padding: "8px 4px" }}>
                          <input
                            type="number"
                            value={row.intakeFlow}
                            onChange={(e) => updateFlowDataRow(idx, "intakeFlow", e.target.value)}
                            placeholder="50"
                            style={{ ...inputStyle, marginTop: 0, padding: "6px 8px", width: "90%" }}
                          />
                        </td>
                        <td style={{ padding: "8px 4px" }}>
                          <input
                            type="number"
                            value={row.exhaustFlow}
                            onChange={(e) => updateFlowDataRow(idx, "exhaustFlow", e.target.value)}
                            placeholder="40"
                            style={{ ...inputStyle, marginTop: 0, padding: "6px 8px", width: "90%" }}
                          />
                        </td>
                        <td style={{ padding: "8px 4px", textAlign: "center" }}>
                          {flowData.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFlowDataRow(idx)}
                              style={{
                                background: "rgba(239,68,68,0.18)",
                                border: "1px solid rgba(239,68,68,0.35)",
                                color: "#fca5a5",
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 11,
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addFlowDataRow}
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(56,189,248,0.35)",
                  background: "rgba(56,189,248,0.18)",
                  color: "#7dd3fc",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                + Add Flow Data Point
              </button>
            </div>

            <label style={labelStyle}>
              Additional Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Testing conditions, porting notes, modifications, etc..."
                style={{ ...inputStyle, minHeight: 80, fontFamily: "monospace" }}
              />
            </label>

            {msg && (
              <div style={{ padding: 12, borderRadius: 8, background: msg.includes("✅") ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)", border: `1px solid ${msg.includes("✅") ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`, color: msg.includes("✅") ? "#86efac" : "#fca5a5" }}>
                {msg}
              </div>
            )}

            {!userId && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)", color: "#93c5fd", fontSize: 12 }}>
                Waiting for user session... {userId ? `(${userId})` : "(not loaded)"}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !userId}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.18)",
                color: "#7dd3fc",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

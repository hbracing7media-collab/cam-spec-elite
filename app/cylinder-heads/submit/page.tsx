"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getSupabaseInstance } from "../../../lib/supabaseSingleton";
import { HEAD_ENGINE_FAMILIES, HEAD_MAKE_OPTIONS, HeadMakeKey } from "@/lib/engineOptions";

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
  const t = useTranslations();
  const isAuthed = useAuthCheck();
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [brand, setBrand] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [engineMake, setEngineMake] = useState<HeadMakeKey>("Ford");
  const [engineFamily, setEngineFamily] = useState<string>(HEAD_ENGINE_FAMILIES.Ford[0] ?? "");

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
    const fam = HEAD_ENGINE_FAMILIES[engineMake];
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

  const families = HEAD_ENGINE_FAMILIES[engineMake] ?? [];

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
      setEngineFamily(HEAD_ENGINE_FAMILIES.Ford[0] ?? "");
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

  if (!isAuthed) return <div style={{ padding: 20, textAlign: "center" }}>{t('common.loading')}</div>;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16, color: "#e5e7eb", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <div style={{ borderRadius: 18, padding: 18, background: "radial-gradient(circle at top left, rgba(56,189,248,0.18), rgba(2,6,23,0.92))", border: "1px solid rgba(56,189,248,0.35)", boxShadow: "0 18px 46px rgba(0,0,0,0.65)" }}>
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 16, color: "#7dd3fc", textAlign: "center" }}>
          {t('heads.submitTitle')}
        </h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.brand')} ({t('common.required')})
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t('heads.brandPlaceholder')} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                {t('heads.partNumber')} ({t('common.required')})
                <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder={t('heads.partNumberPlaceholder')} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.partName')} ({t('common.required')})
                <input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder={t('heads.partNamePlaceholder')} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.engineMake')} ({t('common.required')})
                <select value={engineMake} onChange={(e) => setEngineMake(e.target.value as HeadMakeKey)} style={inputStyle}>
                  {HEAD_MAKE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                {t('heads.engineFamily')} ({t('common.required')})
                <select value={engineFamily} onChange={(e) => setEngineFamily(e.target.value)} style={inputStyle}>
                  {families.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.intakeValveSize')} ({t('common.required')})
                <input value={intakeValveSize} onChange={(e) => setIntakeValveSize(e.target.value)} placeholder={t('heads.intakeValvePlaceholder')} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                {t('heads.exhaustValveSize')} ({t('common.required')})
                <input value={exhaustValveSize} onChange={(e) => setExhaustValveSize(e.target.value)} placeholder={t('heads.exhaustValvePlaceholder')} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.maxLift')} ({t('common.required')})
                <input value={maxLift} onChange={(e) => setMaxLift(e.target.value)} placeholder={t('heads.maxLiftPlaceholder')} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                {t('heads.maxRpm')} ({t('common.required')})
                <input value={maxRpm} onChange={(e) => setMaxRpm(e.target.value)} placeholder={t('heads.maxRpmPlaceholder')} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                {t('heads.intakeRunnerCC')} ({t('common.required')})
                <input value={intakeRunnerCc} onChange={(e) => setIntakeRunnerCc(e.target.value)} placeholder={t('heads.intakeRunnerPlaceholder')} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                {t('heads.chamberCC')} ({t('common.required')})
                <input value={chamberCc} onChange={(e) => setChamberCc(e.target.value)} placeholder={t('heads.chamberPlaceholder')} style={inputStyle} />
              </label>
            </div>

            {/* Flow Data Table */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#cbd5f5", fontWeight: 600, marginBottom: 12 }}>
                {t('heads.flowData')}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.35)" }}>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>{t('heads.liftIn')}</th>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>{t('heads.intakeCFM')}</th>
                      <th style={{ padding: "8px 4px", textAlign: "left", color: "#7dd3fc" }}>{t('heads.exhaustCFM')}</th>
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
                              {t('common.delete')}
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
                {t('heads.addFlowPoint')}
              </button>
            </div>

            <label style={labelStyle}>
              {t('heads.notes')}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('heads.notesPlaceholder')}
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
                {t('common.loading')}
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
              {loading ? t('common.loading') : t('heads.submitForApproval')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

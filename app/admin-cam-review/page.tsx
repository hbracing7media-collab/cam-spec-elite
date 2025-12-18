"use client";

import { useEffect, useState } from "react";

interface CamSubmission {
  id: string;
  user_id: string | null;
  cam_name: string;
  brand: string;
  part_number: string;
  engine_make: string;
  engine_family: string;
  lsa: number | null;
  icl: number | null;
  rocker_ratio: number | null;
  duration_int_050: number | null;
  duration_exh_050: number | null;
  advertised_int: number | null;
  advertised_exh: number | null;
  lift_int: number | null;
  lift_exh: number | null;
  lash_int: number | null;
  lash_exh: number | null;
  notes: string | null;
  cam_card_path: string | null;
  dyno_paths: string[] | null;
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_at: string | null;
}

interface Message {
  type: "ok" | "err" | "info";
  text: string;
}

export default function AdminCamReviewPage() {
  const [submissions, setSubmissions] = useState<CamSubmission[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/admin/storage/approve", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.message || "Failed to fetch submissions." });
        return;
      }
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      setMsg(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error.";
      setMsg({ type: "err", text: errorMsg });
    }
  }

  async function handleReview(id: string, action: "approve" | "deny") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/storage/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.message || `Failed to ${action}.` });
        return;
      }
      setMsg({ type: "ok", text: `Cam ${action}ed!` });
      setExpandedId(null);
      await fetchSubmissions();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error.";
      setMsg({ type: "err", text: errorMsg });
    } finally {
      setBusy(false);
    }
  }

  function getPublicFileUrl(storagePath: string, bucket: "cam_cards" | "dyno_sheets"): string {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
  }

  return (
    <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 20,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1
          style={{
            margin: 0,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 18,
            color: "#7dd3fc",
          }}
        >
          Admin: Cam Review
        </h1>

        <p
          style={{
            marginTop: 8,
            marginBottom: 16,
            color: "rgba(226,232,240,0.9)",
            fontSize: 12,
          }}
        >
          Approve or deny pending submissions from cse_cam_submissions_table.
        </p>

        {msg && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              background:
                msg.type === "err"
                  ? "rgba(251, 113, 133, 0.2)"
                  : msg.type === "ok"
                    ? "rgba(134, 239, 172, 0.2)"
                    : "rgba(147, 197, 253, 0.2)",
              color:
                msg.type === "err"
                  ? "#fb7185"
                  : msg.type === "ok"
                    ? "#86efac"
                    : "#93c5fd",
              fontSize: 12,
              border:
                msg.type === "err"
                  ? "1px solid rgba(251, 113, 133, 0.5)"
                  : msg.type === "ok"
                    ? "1px solid rgba(134, 239, 172, 0.5)"
                    : "1px solid rgba(147, 197, 253, 0.5)",
            }}
          >
            {msg.text}
          </div>
        )}

        {submissions.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "rgba(226,232,240,0.7)" }}>
            <p>No pending submissions.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(2,6,23,0.55)",
                  padding: 14,
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#7dd3fc" }}>
                      {sub.brand} {sub.part_number} — {sub.cam_name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(226,232,240,0.7)", marginTop: 4 }}>
                      {sub.engine_make} / {sub.engine_family}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(226,232,240,0.6)" }}>
                    {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>

                {expandedId === sub.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(148,163,184,0.15)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {sub.lsa !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>LSA:</span> {sub.lsa}</div>}
                      {sub.icl !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>ICL:</span> {sub.icl}</div>}
                      {sub.rocker_ratio !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Rocker:</span> {sub.rocker_ratio}</div>}
                      {sub.duration_int_050 !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Dur Int:</span> {sub.duration_int_050}</div>}
                      {sub.duration_exh_050 !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Dur Exh:</span> {sub.duration_exh_050}</div>}
                      {sub.lift_int !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Lift Int:</span> {sub.lift_int}</div>}
                      {sub.lift_exh !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Lift Exh:</span> {sub.lift_exh}</div>}
                      {sub.advertised_int !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Adv Int:</span> {sub.advertised_int}</div>}
                      {sub.advertised_exh !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Adv Exh:</span> {sub.advertised_exh}</div>}
                      {sub.lash_int !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Lash Int:</span> {sub.lash_int}</div>}
                      {sub.lash_exh !== null && <div style={{ fontSize: 11 }}><span style={{ color: "rgba(226,232,240,0.6)" }}>Lash Exh:</span> {sub.lash_exh}</div>}
                    </div>

                    {sub.notes && (
                      <div style={{ marginBottom: 14, padding: 10, background: "rgba(2,6,23,0.8)", borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "rgba(226,232,240,0.6)", marginBottom: 4 }}>Notes:</div>
                        <div style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{sub.notes}</div>
                      </div>
                    )}

                    {(sub.cam_card_path || sub.dyno_paths?.length) && (
                      <div style={{ marginBottom: 14, fontSize: 11 }}>
                        <div style={{ color: "rgba(226,232,240,0.6)", marginBottom: 8 }}>Files:</div>
                        {sub.cam_card_path && (
                          <div style={{ marginBottom: 8, padding: 10, background: "rgba(34,211,238,0.1)", borderRadius: 6 }}>
                            <a href={getPublicFileUrl(sub.cam_card_path, "cam_cards")} target="_blank" rel="noopener noreferrer" style={{ color: "#7dd3fc", textDecoration: "underline", fontWeight: 600 }}>📄 Cam Card</a>
                          </div>
                        )}
                        {sub.dyno_paths?.map((p, i) => (
                          <div key={`dyno-${i}`} style={{ marginBottom: 8, padding: 10, background: "rgba(34,211,238,0.1)", borderRadius: 6 }}>
                            <a href={getPublicFileUrl(p, "dyno_sheets")} target="_blank" rel="noopener noreferrer" style={{ color: "#7dd3fc", textDecoration: "underline", fontWeight: 600 }}>📊 Dyno Sheet {i + 1}</a>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => handleReview(sub.id, "approve")} disabled={busy} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(134,239,172,0.5)", background: busy ? "rgba(100,116,139,0.25)" : "rgba(134,239,172,0.2)", color: "#86efac", cursor: busy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>✓ Approve</button>
                      <button type="button" onClick={() => handleReview(sub.id, "deny")} disabled={busy} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(251,113,133,0.5)", background: busy ? "rgba(100,116,139,0.25)" : "rgba(251,113,133,0.2)", color: "#fb7185", cursor: busy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>✕ Deny</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

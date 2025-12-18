"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
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
  status: string;
  created_at: string;
  images?: Array<{ id: string; file_url: string }>;
};

export default function AdminCylinderHeadReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    try {
      const res = await fetch("/api/admin/cylinder-heads/pending");
      if (!res.ok) throw new Error("Failed to load submissions");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Load error");
    } finally {
      setLoading(false);
    }
  }

  async function approveSubmission(submissionId: string) {
    try {
      const res = await fetch(`/api/admin/cylinder-heads/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) throw new Error("Approval failed");
      setMsg("✅ Approved");
      await loadSubmissions();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  async function rejectSubmission(submissionId: string) {
    try {
      const res = await fetch(`/api/admin/cylinder-heads/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      setMsg("✅ Rejected");
      await loadSubmissions();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 20, color: "#e5e7eb", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#7dd3fc" }}>Cylinder Head Submissions Review</h1>
      {msg && <div style={{ padding: 12, marginBottom: 12, background: "rgba(34,197,94,0.18)", borderRadius: 8 }}>{msg}</div>}

      {submissions.length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {submissions.map((sub) => (
            <div key={sub.id} style={{ background: "rgba(2,6,23,0.55)", padding: 20, borderRadius: 12, border: "1px solid rgba(56,189,248,0.35)" }}>
              <h2 style={{ margin: "0 0 12px 0", color: "#7dd3fc" }}>
                {sub.brand} {sub.part_number}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <strong>Engine:</strong> {sub.engine_make} - {sub.engine_family}
                </div>
                <div>
                  <strong>Valves:</strong> Int: {sub.intake_valve_size}mm, Exh: {sub.exhaust_valve_size}mm
                </div>
                <div>
                  <strong>Max Lift:</strong> {sub.max_lift}"
                </div>
                <div>
                  <strong>Max RPM:</strong> {sub.max_rpm}
                </div>
                <div>
                  <strong>Intake Runner:</strong> {sub.intake_runner_cc}cc
                </div>
                <div>
                  <strong>Chamber:</strong> {sub.chamber_cc}cc
                </div>
              </div>

              {/* Flow Data */}
              {sub.flow_data && Array.isArray(sub.flow_data) && sub.flow_data.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <strong>Flow Data:</strong>
                <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(56,189,248,0.35)" }}>
                      <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Lift (in)</th>
                      <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Intake (CFM)</th>
                      <th style={{ padding: 8, textAlign: "left", color: "#7dd3fc" }}>Exhaust (CFM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.flow_data.map((point, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(56,189,248,0.18)" }}>
                        <td style={{ padding: 8 }}>{point.lift}</td>
                        <td style={{ padding: 8 }}>{point.intakeFlow}</td>
                        <td style={{ padding: 8 }}>{point.exhaustFlow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Images */}
              {sub.images && sub.images.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Verification Images:</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 8 }}>
                    {sub.images.map((img) => (
                      <a key={img.id} href={img.file_url} target="_blank" rel="noreferrer">
                        <img
                          src={img.file_url}
                          alt="verification"
                          style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, cursor: "pointer" }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {sub.notes && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Notes:</strong>
                  <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{sub.notes}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => approveSubmission(sub.id)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(34,197,94,0.18)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    color: "#86efac",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectSubmission(sub.id)}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(239,68,68,0.18)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#fca5a5",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

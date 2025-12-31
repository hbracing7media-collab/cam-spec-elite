"use client";

import { useEffect, useState } from "react";
import { DynoGraph } from "./DynoGraph";

interface DynoSubmission {
  id: string;
  engine_name: string;
  engine_make: string;
  engine_family: string;
  horsepower: number;
  torque: number;
  visibility: string;
  status: string;
  created_at: string;
  spec: {
    rpm_intervals: Array<{ rpm: number; hp: number; torque: number }>;
  };
}

export function UserDynoSubmissions({ userId }: { userId: string }) {
  const [submissions, setSubmissions] = useState<DynoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Use API route instead of direct Supabase client to ensure proper filtering
        const res = await fetch("/api/profile/dyno-submissions");
        const data = await res.json();

        if (!data.ok) {
          setError(data.message || "Failed to load submissions");
          return;
        }

        setSubmissions(data.submissions || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSubmissions();
    }
  }, [userId]);

  if (loading) {
    return <div style={{ color: "#94a3b8" }}>Loading dyno submissions...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "#fb7185" }}>Error: {error}</div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
        No dyno submissions yet
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {submissions.map((submission) => {
        const isExpanded = expandedId === submission.id;
        const hasRpmData = submission.spec?.rpm_intervals && submission.spec.rpm_intervals.length > 0;
        
        return (
          <div
            key={submission.id}
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.3)",
              background: "rgba(15,23,42,0.5)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, color: "#7dd3fc", fontWeight: 600 }}>
                  {submission.engine_name}
                </h3>
                <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: 12 }}>
                  {submission.engine_make} {submission.engine_family}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#22c55e", fontWeight: 600, fontSize: 14 }}>
                  {submission.horsepower} HP
                </div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>
                  {submission.torque} lb-ft
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  background:
                    submission.visibility === "public"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(168,85,247,0.2)",
                  color:
                    submission.visibility === "public"
                      ? "#86efac"
                      : "#d8b4fe",
                }}
              >
                {submission.visibility}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  background: "rgba(56,189,248,0.2)",
                  color: "#7dd3fc",
                }}
              >
                {submission.status}
              </span>
              {hasRpmData && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    background: "rgba(245,158,11,0.2)",
                    color: "#fbbf24",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {isExpanded ? "▼ Hide Graph" : "▶ View Graph"}
                </button>
              )}
            </div>

            {isExpanded && hasRpmData && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(56,189,248,0.2)" }}>
                <DynoGraph
                  rpmIntervals={submission.spec.rpm_intervals}
                  engineName={submission.engine_name}
                />
              </div>
            )}

            {submission.spec?.rpm_intervals && submission.spec.rpm_intervals.length > 0 && !isExpanded && (
              <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(56,189,248,0.2)" }}>
                <strong>RPM Data ({submission.spec.rpm_intervals.length} points):</strong>
                <div style={{ marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {submission.spec.rpm_intervals.slice(0, 4).map((interval, idx) => (
                    <div key={idx} style={{ fontSize: 10 }}>
                      {interval.rpm} RPM: {interval.hp}hp / {interval.torque}tq
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>
              {new Date(submission.created_at).toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

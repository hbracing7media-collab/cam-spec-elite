"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

type PendingHead = {
  id: string;
  brand: string;
  part_number: string;
  part_name: string;
  location: string;
  engine_make: string;
  engine_family: string;
  intake_valve_size: number | null;
  exhaust_valve_size: number | null;
  max_lift: number | null;
  max_rpm: number | null;
  intake_runner_cc: number | null;
  chamber_cc: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export default function CylinderHeadsApprovePage() {
  const isAuthed = useAuthCheck();
  const [heads, setHeads] = useState<PendingHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingHeads();
  }, []);

  async function fetchPendingHeads() {
    try {
      const res = await fetch("/api/admin/cylinder-heads/pending");
      if (res.ok) {
        const data = await res.json();
        setHeads(data.heads || []);
      }
    } catch (error) {
      console.error("Failed to load pending heads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(headId: string) {
    setActionLoading(headId);
    try {
      const res = await fetch("/api/admin/cylinder-heads/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headId }),
      });

      if (res.ok) {
        setHeads(heads.filter((h) => h.id !== headId));
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeny(headId: string) {
    setActionLoading(headId);
    try {
      const res = await fetch("/api/admin/cylinder-heads/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headId }),
      });

      if (res.ok) {
        setHeads(heads.filter((h) => h.id !== headId));
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  }

  if (isAuthed === null) return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;
  if (loading) return <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>;

  return (
    <main style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ color: "#d8b4fe", marginBottom: 24 }}>Cylinder Heads Approval</h1>

      {heads.length === 0 ? (
        <div style={{ color: "#cbd5f5", fontSize: 14 }}>No pending heads for approval.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {heads.map((head) => (
            <div
              key={head.id}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(168,85,247,0.35)",
                background: "rgba(168,85,247,0.08)",
                padding: 16,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Brand</div>
                  <div style={{ color: "#d8b4fe", fontWeight: 600 }}>{head.brand}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Part Number</div>
                  <div style={{ color: "#d8b4fe", fontWeight: 600 }}>{head.part_number}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Part Name</div>
                  <div style={{ color: "#e2e8f0" }}>{head.part_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Location</div>
                  <div style={{ color: "#e2e8f0" }}>{head.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Engine Make</div>
                  <div style={{ color: "#e2e8f0" }}>{head.engine_make}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Engine Family</div>
                  <div style={{ color: "#e2e8f0" }}>{head.engine_family}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {head.intake_valve_size && (
                  <div>
                    <div style={{ fontSize: 12, color: "#cbd5f5" }}>Intake Valve</div>
                    <div style={{ color: "#e2e8f0" }}>{head.intake_valve_size}</div>
                  </div>
                )}
                {head.exhaust_valve_size && (
                  <div>
                    <div style={{ fontSize: 12, color: "#cbd5f5" }}>Exhaust Valve</div>
                    <div style={{ color: "#e2e8f0" }}>{head.exhaust_valve_size}</div>
                  </div>
                )}
                {head.max_lift && (
                  <div>
                    <div style={{ fontSize: 12, color: "#cbd5f5" }}>Max Lift</div>
                    <div style={{ color: "#e2e8f0" }}>{head.max_lift}</div>
                  </div>
                )}
                {head.chamber_cc && (
                  <div>
                    <div style={{ fontSize: 12, color: "#cbd5f5" }}>Chamber CC</div>
                    <div style={{ color: "#e2e8f0" }}>{head.chamber_cc}</div>
                  </div>
                )}
              </div>

              {head.notes && (
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(168,85,247,0.15)" }}>
                  <div style={{ fontSize: 12, color: "#cbd5f5", marginBottom: 4 }}>Notes</div>
                  <div style={{ color: "#e2e8f0", fontSize: 13 }}>{head.notes}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleApprove(head.id)}
                  disabled={actionLoading === head.id}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(34,197,94,0.5)",
                    background: "rgba(34,197,94,0.2)",
                    color: "#86efac",
                    cursor: actionLoading === head.id ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {actionLoading === head.id ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => handleDeny(head.id)}
                  disabled={actionLoading === head.id}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.5)",
                    background: "rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                    cursor: actionLoading === head.id ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {actionLoading === head.id ? "Denying..." : "Deny"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

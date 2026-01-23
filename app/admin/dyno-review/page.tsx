"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseInstance } from "@/lib/supabaseSingleton";

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
  user_id: string;
  dyno_run_image: string | null;
  cam_card_image: string | null;
  car_photo_image: string | null;
  spec: any;
}

export default function AdminDynoReviewPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submissions, setSubmissions] = useState<DynoSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DynoSubmission | null>(null);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const supabase = getSupabaseInstance();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setChecking(false);
        await loadPendingSubmissions();
        
        // Auto-refresh pending submissions every 5 seconds
        const interval = setInterval(loadPendingSubmissions, 5000);
        return () => clearInterval(interval);
      }
    };
    checkAuth();
  }, [router]);

  const loadPendingSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dyno_submissions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load submissions:", error);
        return;
      }

      setSubmissions(data || []);
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      const res = await fetch("/api/admin/dyno-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action: "approve" }),
      });

      const result = await res.json();

      if (!result.ok) {
        setReviewMsg("Error approving: " + result.message);
        return;
      }

      setReviewMsg("✓ Submission approved!");
      setSelectedSubmission(null);
      await loadPendingSubmissions();
      setTimeout(() => setReviewMsg(null), 3000);
    } catch (err: any) {
      setReviewMsg("Error: " + err.message);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = prompt("Rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      const res = await fetch("/api/admin/dyno-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action: "reject" }),
      });

      const result = await res.json();

      if (!result.ok) {
        setReviewMsg("Error rejecting: " + result.message);
        return;
      }

      setReviewMsg("✓ Submission rejected!");
      setSelectedSubmission(null);
      await loadPendingSubmissions();
      setTimeout(() => setReviewMsg(null), 3000);
    } catch (err: any) {
      setReviewMsg("Error: " + err.message);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `${supabaseUrl}/storage/v1/object/public/dyno_runs/${path}` ||
           `${supabaseUrl}/storage/v1/object/public/dyno_cam_cards/${path}` ||
           `${supabaseUrl}/storage/v1/object/public/dyno_car_photos/${path}`;
  };

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.10), rgba(15,23,42,0.92))",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#00d4ff",
              margin: "0 0 8px 0",
              textShadow: "0 0 20px rgba(0,212,255,0.4)",
            }}
          >
            🔐 Dyno Submissions Review
          </h1>
          <p style={{ color: "rgba(226,232,240,0.7)", margin: 0 }}>
            {submissions.length} pending submission{submissions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
          {/* Submissions List */}
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(2,6,23,0.85)",
              height: "fit-content",
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px 0",
                fontSize: 16,
                fontWeight: 700,
                color: "#7dd3fc",
              }}
            >
              Pending Review
            </h2>

            {submissions.length === 0 ? (
              <div style={{ color: "rgba(226,232,240,0.5)", fontSize: 14 }}>
                {loading ? "Loading..." : "No pending submissions"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {submissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: selectedSubmission?.id === submission.id ? "2px solid #00d4ff" : "1px solid rgba(56,189,248,0.2)",
                      background: selectedSubmission?.id === submission.id ? "rgba(0,212,255,0.1)" : "rgba(15,23,42,0.5)",
                      color: "#e2e8f0",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#7dd3fc", marginBottom: 4 }}>
                      {submission.engine_name}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {submission.engine_make} {submission.engine_family}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {submission.horsepower} HP • {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submission Details */}
          {selectedSubmission ? (
            <div
              style={{
                borderRadius: 16,
                padding: 24,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(2,6,23,0.85)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#00d4ff",
                  }}
                >
                  {selectedSubmission.engine_name}
                </h3>

                {/* Engine Info */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: "rgba(15,23,42,0.5)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Make</div>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {selectedSubmission.engine_make || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Family</div>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {selectedSubmission.engine_family || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Horsepower</div>
                      <div style={{ fontWeight: 600, color: "#22c55e", fontSize: 16 }}>
                        {selectedSubmission.horsepower} HP
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Torque</div>
                      <div style={{ fontWeight: 600, color: "#f59e0b", fontSize: 16 }}>
                        {selectedSubmission.torque} lb-ft
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Visibility</div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: selectedSubmission.visibility === "public" ? "#86efac" : "#d8b4fe",
                        }}
                      >
                        {selectedSubmission.visibility}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Submitted</div>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>
                        {new Date(selectedSubmission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#7dd3fc", fontSize: 14 }}>Uploaded Images</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {/* Dyno Graph */}
                    <div
                      style={{
                        borderRadius: 8,
                        border: "1px solid rgba(56,189,248,0.2)",
                        background: "rgba(15,23,42,0.5)",
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600, marginBottom: 8 }}>
                        📊 Dyno Graph
                      </div>
                      {selectedSubmission.dyno_run_image ? (
                        <img
                          src={`${supabaseUrl}/storage/v1/object/public/dyno_runs/${selectedSubmission.dyno_run_image}`}
                          alt="Dyno Graph"
                          style={{ width: "100%", borderRadius: 6, maxHeight: 150, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>No image</div>
                      )}
                    </div>

                    {/* Cam Card */}
                    <div
                      style={{
                        borderRadius: 8,
                        border: "1px solid rgba(56,189,248,0.2)",
                        background: "rgba(15,23,42,0.5)",
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600, marginBottom: 8 }}>
                        🔧 Cam Card
                      </div>
                      {selectedSubmission.cam_card_image ? (
                        <img
                          src={`${supabaseUrl}/storage/v1/object/public/dyno_cam_cards/${selectedSubmission.cam_card_image}`}
                          alt="Cam Card"
                          style={{ width: "100%", borderRadius: 6, maxHeight: 150, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>No image</div>
                      )}
                    </div>

                    {/* Car Photo */}
                    <div
                      style={{
                        borderRadius: 8,
                        border: "1px solid rgba(56,189,248,0.2)",
                        background: "rgba(15,23,42,0.5)",
                        padding: 12,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600, marginBottom: 8 }}>
                        🏎️ Car Photo
                      </div>
                      {selectedSubmission.car_photo_image ? (
                        <img
                          src={`${supabaseUrl}/storage/v1/object/public/dyno_car_photos/${selectedSubmission.car_photo_image}`}
                          alt="Car Photo"
                          style={{ width: "100%", borderRadius: 6, maxHeight: 150, objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>No image</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {reviewMsg && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 16,
                      background: reviewMsg.includes("✓") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: reviewMsg.includes("✓")
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid rgba(239,68,68,0.3)",
                      color: reviewMsg.includes("✓") ? "#86efac" : "#fca5a5",
                      fontSize: 13,
                    }}
                  >
                    {reviewMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 16,
                padding: 24,
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(2,6,23,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                color: "rgba(226,232,240,0.5)",
              }}
            >
              Select a submission to review
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

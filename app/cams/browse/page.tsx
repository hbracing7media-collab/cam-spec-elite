"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface CamSubmission {
  id: string;
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
  created_at: string;
}

interface Message {
  type: "ok" | "err" | "info";
  text: string;
}

function CamsBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const make = searchParams.get("make") || "";
  const family = searchParams.get("family") || "";

  const [cams, setCams] = useState<CamSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  useEffect(() => {
    if (make && family) {
      fetchCams();
    }
  }, [make, family]);

  async function fetchCams() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cams/search?make=${encodeURIComponent(make)}&family=${encodeURIComponent(family)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setMsg({
          type: "err",
          text: data?.message || "Failed to fetch cams.",
        });
        setCams([]);
        return;
      }

      setCams(Array.isArray(data.cams) ? data.cams : []);
      setMsg(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error.";
      setMsg({ type: "err", text: errorMsg });
    } finally {
      setLoading(false);
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(2,6,23,0.6)",
              color: "#7dd3fc",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
          <div>
            <h1
              style={{
                margin: 0,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontSize: 18,
                color: "#7dd3fc",
              }}
            >
              {make} {family}
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "rgba(226,232,240,0.7)",
                fontSize: 11,
              }}
            >
              Approved cams
            </p>
          </div>
        </div>

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

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "rgba(226,232,240,0.7)" }}>
            <p>Loading cams...</p>
          </div>
        ) : cams.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "rgba(226,232,240,0.7)" }}>
            <p>No approved cams found for {make} {family}.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {cams.map((cam) => (
              <div
                key={cam.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(2,6,23,0.55)",
                  padding: 14,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setExpandedId(expandedId === cam.id ? null : cam.id)
                }
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#7dd3fc",
                    marginBottom: 6,
                  }}
                >
                  {cam.brand} {cam.part_number}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(226,232,240,0.8)",
                    marginBottom: 8,
                  }}
                >
                  {cam.cam_name}
                </div>

                {expandedId === cam.id && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(148,163,184,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        marginBottom: 12,
                        fontSize: 10,
                      }}
                    >
                      {cam.lsa !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            LSA:
                          </span>{" "}
                          {cam.lsa}
                        </div>
                      )}
                      {cam.icl !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            ICL:
                          </span>{" "}
                          {cam.icl}
                        </div>
                      )}
                      {cam.rocker_ratio !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Rocker:
                          </span>{" "}
                          {cam.rocker_ratio}
                        </div>
                      )}
                      {cam.duration_int_050 !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Dur Int:
                          </span>{" "}
                          {cam.duration_int_050}
                        </div>
                      )}
                      {cam.duration_exh_050 !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Dur Exh:
                          </span>{" "}
                          {cam.duration_exh_050}
                        </div>
                      )}
                      {cam.lift_int !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Lift Int:
                          </span>{" "}
                          {cam.lift_int}
                        </div>
                      )}
                      {cam.lift_exh !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Lift Exh:
                          </span>{" "}
                          {cam.lift_exh}
                        </div>
                      )}
                      {cam.advertised_int !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Adv Int:
                          </span>{" "}
                          {cam.advertised_int}
                        </div>
                      )}
                      {cam.advertised_exh !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Adv Exh:
                          </span>{" "}
                          {cam.advertised_exh}
                        </div>
                      )}
                      {cam.lash_int !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Lash Int:
                          </span>{" "}
                          {cam.lash_int}
                        </div>
                      )}
                      {cam.lash_exh !== null && (
                        <div>
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>
                            Lash Exh:
                          </span>{" "}
                          {cam.lash_exh}
                        </div>
                      )}
                    </div>

                    {cam.notes && (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: 8,
                          background: "rgba(2,6,23,0.8)",
                          borderRadius: 6,
                          fontSize: 10,
                        }}
                      >
                        <div
                          style={{
                            color: "rgba(226,232,240,0.6)",
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          Notes:
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {cam.notes}
                        </div>
                      </div>
                    )}

                    {(cam.cam_card_path || cam.dyno_paths?.length) && (
                      <div style={{ marginBottom: 12, fontSize: 10 }}>
                        <div
                          style={{
                            color: "rgba(226,232,240,0.6)",
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          Files:
                        </div>
                        {cam.cam_card_path && (
                          <div style={{ marginBottom: 4 }}>
                            <a
                              href={getPublicFileUrl(
                                cam.cam_card_path,
                                "cam_cards"
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#7dd3fc",
                                textDecoration: "underline",
                              }}
                            >
                              📄 Cam Card
                            </a>
                          </div>
                        )}
                        {cam.dyno_paths?.map((p, i) => (
                          <div key={`dyno-${i}`}>
                            <a
                              href={getPublicFileUrl(p, "dyno_sheets")}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#7dd3fc",
                                textDecoration: "underline",
                              }}
                            >
                              📊 Dyno {i + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
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

export default function CamsBrowsePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading...</div>}>
      <CamsBrowseContent />
    </Suspense>
  );
}
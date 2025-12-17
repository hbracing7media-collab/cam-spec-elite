"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type SubmissionRow = {
  id: string;
  created_at: string;
  cam_name: string | null;
  engine_make: string | null;
  engine_family: string | null;
  notes: string | null;
  cam_card_path: string | null;
  spec: any;
  status: string | null;
};

const SUPABASE_URL = "https://api.hbracing7.com";
const SUPABASE_ANON_KEY = "sb_publishable_uFDAq_Hm9Bs0X7rNUOca7Q_7vCnMChj";

// Storage bucket where cam card images live:
const BUCKET_NAME = "cam_cards";

// Tables:
const TABLE = "cse_cam_submissions_table";
const ADMINS_TABLE = "cse_admins";

export default function AdminCamReviewPage() {
  const supabase = useMemo(
    () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
    []
  );

  const [adminState, setAdminState] = useState<string>("Checking admin…");
  const [whoLine, setWhoLine] = useState<string>("");
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "err" | "" }>({
    text: "Waiting…",
    kind: "",
  });

  const [pending, setPending] = useState<SubmissionRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState<string>("");

  const current = useMemo(
    () => pending.find((p) => p.id === currentId) || null,
    [pending, currentId]
  );

  function setStatusText(text: string, kind: "ok" | "err" | "" = "") {
    setMsg({ text, kind });
  }

  async function requireAdmin() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    const user = data.user;
    if (!user) {
      setAdminState("Not logged in");
      setStatusText("Please log in (this page requires an authenticated admin).", "err");
      return { ok: false as const };
    }

    setWhoLine(user.email ? `Logged in: ${user.email}` : `Logged in: ${user.id}`);

    // Admin check: cse_admins.user_id must contain auth user id
    const { data: adminRow, error: adminErr } = await supabase
      .from(ADMINS_TABLE)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr) throw adminErr;

    if (!adminRow) {
      setAdminState("Not admin");
      setStatusText("You are logged in, but your account is not in cse_admins.", "err");
      return { ok: false as const, user };
    }

    setAdminState("Admin: OK");
    return { ok: true as const, user };
  }

  async function getPhotoUrl(cam_card_path: string | null) {
    if (!cam_card_path) return null;

    if (cam_card_path.startsWith("http://") || cam_card_path.startsWith("https://")) {
      return cam_card_path;
    }

    // Public URL (if bucket is public)
    const pub = supabase.storage.from(BUCKET_NAME).getPublicUrl(cam_card_path);
    if (pub?.data?.publicUrl) return pub.data.publicUrl;

    // Signed URL fallback (if bucket is private)
    const signed = await supabase.storage.from(BUCKET_NAME).createSignedUrl(cam_card_path, 60 * 60);
    if (signed?.data?.signedUrl) return signed.data.signedUrl;

    return null;
  }

  async function loadQueue() {
    setStatusText("Loading pending queue…");
    setPhotoUrl(null);
    setCurrentId(null);

    const { data, error } = await supabase
      .from(TABLE)
      .select("id, created_at, cam_name, engine_make, engine_family, notes, cam_card_path, spec, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setPending([]);
      setStatusText("Failed to load queue: " + error.message, "err");
      return;
    }

    const rows = (data || []) as SubmissionRow[];
    setPending(rows);
    setStatusText(`Loaded ${rows.length} pending cams.`, "ok");

    if (rows.length) setCurrentId(rows[0].id);
  }

  async function refreshCurrentPhoto(row: SubmissionRow | null) {
    setPhotoUrl(null);
    if (!row) return;

    const url = await getPhotoUrl(row.cam_card_path);
    setPhotoUrl(url);
  }

  async function setStatus(newStatus: "approved" | "denied") {
    if (!current) return;

    setStatusText(`${newStatus.toUpperCase()}…`);
    const updates: any = { status: newStatus };

    if (newStatus === "denied" && denyReason.trim()) {
      const existing = current.notes ? String(current.notes) : "";
      updates.notes =
        (existing ? existing + "\n\n" : "") + `[ADMIN DENIAL]: ${denyReason.trim()}`;
    }

    const { error } = await supabase.from(TABLE).update(updates).eq("id", current.id);

    if (error) {
      console.error(error);
      setStatusText("Update failed (likely RLS): " + error.message, "err");
      return;
    }

    setStatusText(`Updated to ${newStatus}.`, "ok");
    setDenyReason("");

    // Remove from local queue
    const next = pending.filter((p) => p.id !== current.id);
    setPending(next);

    if (next.length) {
      setCurrentId(next[0].id);
    } else {
      setCurrentId(null);
      setPhotoUrl(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    location.reload();
  }

  // Boot + listen for auth changes
  useEffect(() => {
    let sub: any;

    (async () => {
      try {
        const admin = await requireAdmin();
        if (!admin.ok) return;
        await loadQueue();
      } catch (e: any) {
        console.error(e);
        setStatusText("Error: " + (e?.message || String(e)), "err");
      }
    })();

    sub = supabase.auth.onAuthStateChange((_event) => {
      // If session changes, re-check admin + reload queue
      requireAdmin().then((a) => {
        if (a.ok) loadQueue();
      });
    });

    return () => {
      sub?.data?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When current changes, load its photo
  useEffect(() => {
    refreshCurrentPhoto(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  return (
    <div style={{ minHeight: "100vh", padding: 16, color: "#e5e7eb", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      background:
        "radial-gradient(circle at 10% 0%, rgba(56,189,248,.18), transparent 45%)," +
        "radial-gradient(circle at 90% 0%, rgba(244,114,182,.16), transparent 45%)," +
        "radial-gradient(circle at 50% 100%, rgba(167,139,250,.12), transparent 55%)," +
        "linear-gradient(180deg, #050816, #020617)"
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: 14, borderRadius: 18, border: "1px solid rgba(56,189,248,.35)",
        background: "rgba(2,6,23,.65)", boxShadow: "0 18px 46px rgba(0,0,0,.55)"
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase", color: "#7dd3fc", fontSize: 15 }}>
              Cam Spec Elite — Admin Moderation
            </div>
            <div style={{ color: "#cbd5f5", fontSize: 12 }}>
              Review pending cam submissions. Preview photo + specs. Approve or deny in one click.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ padding: "7px 10px", borderRadius: 999, border: "1px solid rgba(56,189,248,.35)", background: "rgba(2,6,23,.55)", color: "#cbd5f5", fontSize: 12 }}>
              <strong style={{ color: "#e5e7eb" }}>{adminState}</strong>
            </div>
            <div style={{ padding: "7px 10px", borderRadius: 999, border: "1px solid rgba(56,189,248,.35)", background: "rgba(2,6,23,.55)", color: "#cbd5f5", fontSize: 12 }}>
              Queue: <strong style={{ color: "#e5e7eb" }}>{pending.length}</strong>
            </div>
            <button onClick={loadQueue} style={{ cursor: "pointer", borderRadius: 12, padding: "10px 12px", fontWeight: 800, border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.55)", color: "#e5e7eb" }}>
              Refresh Queue
            </button>
            <button onClick={signOut} style={{ cursor: "pointer", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900,
              background: "linear-gradient(90deg, rgba(56,189,248,.95), rgba(244,114,182,.9))", color: "#06101a"
            }}>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div><b>Status:</b> <span style={{ color: msg.kind === "err" ? "#fecaca" : msg.kind === "ok" ? "#bbf7d0" : "#e5e7eb" }}>{msg.text}</span></div>
          <div>{whoLine}</div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "14px auto 0", display: "grid", gridTemplateColumns: "1.05fr 1.95fr", gap: 14 }}>
        {/* LEFT */}
        <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(56,189,248,.35)", background: "rgba(2,6,23,.75)", boxShadow: "0 18px 46px rgba(0,0,0,.55)" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(56,189,248,.22)", background: "linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))" }}>
            <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "#bfe9ff", fontWeight: 900 }}>
              Pending Queue
            </div>
          </div>

          <div style={{ maxHeight: "calc(100vh - 210px)", overflow: "auto" }}>
            {pending.length === 0 ? (
              <div style={{ padding: 14, borderBottom: "1px solid rgba(148,163,184,.12)" }}>
                <div style={{ fontWeight: 900, color: "#eaf2ff", fontSize: 13 }}>No pending cams 🎉</div>
                <div style={{ fontSize: 12, color: "#cbd5f5", marginTop: 4 }}>Nothing to review right now.</div>
              </div>
            ) : (
              pending.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setCurrentId(r.id)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(148,163,184,.12)",
                    cursor: "pointer",
                    background: currentId === r.id ? "rgba(244,114,182,.07)" : "transparent",
                    borderLeft: currentId === r.id ? "3px solid rgba(244,114,182,.65)" : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900, color: "#eaf2ff", fontSize: 13 }}>
                      {r.cam_name || "(No name)"}
                    </div>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(245,158,11,.45)", color: "#fde68a", background: "rgba(2,6,23,.45)" }}>
                      pending
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5f5", marginTop: 4 }}>
                    {(r.engine_make || "—")} • {(r.engine_family || "—")} • {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(56,189,248,.35)", background: "rgba(2,6,23,.75)", boxShadow: "0 18px 46px rgba(0,0,0,.55)" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(56,189,248,.22)", background: "linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))" }}>
            <div style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "#bfe9ff", fontWeight: 900 }}>
              Review
            </div>
          </div>

          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 14 }}>
            <div style={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.45)", padding: 12 }}>
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Cam Name</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginTop: 4 }}>{current?.cam_name || "Select a cam…"}</div>

              <div style={{ height: 10 }} />
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Engine</div>
              <div style={{ fontSize: 12, color: "#cbd5f5", marginTop: 4 }}>
                {current ? `${current.engine_make || "—"} • ${current.engine_family || "—"}` : "—"}
              </div>

              <div style={{ height: 10 }} />
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Notes</div>
              <div style={{ fontSize: 12, color: "#cbd5f5", marginTop: 4, whiteSpace: "pre-wrap" }}>
                {current?.notes || "—"}
              </div>

              <div style={{ height: 12 }} />
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Denial Reason (optional)</div>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Example: photo is blurry, missing duration/LSA, bad data, etc."
                style={{
                  width: "100%",
                  minHeight: 90,
                  borderRadius: 14,
                  padding: "10px 12px",
                  border: "1px solid rgba(56,189,248,.22)",
                  background: "rgba(2,6,23,.55)",
                  color: "#e5e7eb",
                  outline: "none",
                  resize: "vertical",
                  marginTop: 8,
                }}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <button
                  disabled={!current}
                  onClick={() => setStatus("approved")}
                  style={{
                    cursor: current ? "pointer" : "not-allowed",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontWeight: 900,
                    background: "linear-gradient(90deg, rgba(34,197,94,.95), rgba(56,189,248,.85))",
                    color: "#04120b",
                    opacity: current ? 1 : 0.55,
                  }}
                >
                  Approve
                </button>

                <button
                  disabled={!current}
                  onClick={() => setStatus("denied")}
                  style={{
                    cursor: current ? "pointer" : "not-allowed",
                    border: "none",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontWeight: 900,
                    background: "linear-gradient(90deg, rgba(239,68,68,.95), rgba(244,114,182,.85))",
                    color: "#1b070a",
                    opacity: current ? 1 : 0.55,
                  }}
                >
                  Deny
                </button>

                <button
                  disabled={!photoUrl}
                  onClick={() => photoUrl && window.open(photoUrl, "_blank", "noopener,noreferrer")}
                  style={{
                    cursor: photoUrl ? "pointer" : "not-allowed",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontWeight: 900,
                    border: "1px solid rgba(148,163,184,.25)",
                    background: "rgba(2,6,23,.55)",
                    color: "#e5e7eb",
                    opacity: photoUrl ? 1 : 0.55,
                  }}
                >
                  Open Photo
                </button>
              </div>
            </div>

            <div style={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.45)", padding: 12 }}>
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Cam Card Photo</div>
              <div style={{
                borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(56,189,248,.22)",
                background: "rgba(2,6,23,.55)",
                minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 8
              }}>
                {current ? (
                  photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Cam card photo" src={photoUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <div style={{ fontSize: 12, color: "#cbd5f5", opacity: 0.9, padding: 10, textAlign: "center" }}>
                      No photo found OR cam_card_path not saved.
                      <br /><br />
                      <b>cam_card_path:</b> {current.cam_card_path || "—"}
                    </div>
                  )
                ) : (
                  <div style={{ fontSize: 12, color: "#cbd5f5", opacity: 0.9, padding: 10, textAlign: "center" }}>
                    Select a cam to preview its uploaded cam card photo.
                  </div>
                )}
              </div>

              <div style={{ height: 12 }} />
              <div style={{ fontSize: 11, color: "#cbd5f5", letterSpacing: ".08em", textTransform: "uppercase" }}>Specs (JSON)</div>
              <div style={{
                marginTop: 8,
                borderRadius: 14,
                border: "1px solid rgba(56,189,248,.22)",
                background: "rgba(2,6,23,.55)",
                padding: 10
              }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, lineHeight: 1.35 }}>
                  {current ? JSON.stringify(current.spec ?? {}, null, 2) : "—"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* responsive */}
      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 1.05fr 1.95fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1.05fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

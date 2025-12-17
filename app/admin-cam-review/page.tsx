"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type PendingRow = {
  id: string;
  created_at: string;
  cam_name?: string | null;
  engine_make?: string | null;
  engine_family?: string | null;
  notes?: string | null;
  cam_card_path?: string | null;
  spec?: any;
  status?: string | null;
};

const BUCKET_NAME = "cam_cards";
const TABLE = "cse_cam_submissions_table";
const ADMINS_TABLE = "cse_admins";

function escapeHtml(s: any) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

function safeJsonPretty(v: any) {
  try { return JSON.stringify(v ?? {}, null, 2); }
  catch { return String(v ?? ""); }
}

function pickSpecValue(spec: any, keys: string[]) {
  if (!spec || typeof spec !== "object") return null;
  for (const k of keys) {
    if (spec[k] != null && String(spec[k]).trim() !== "") return spec[k];
  }
  return null;
}

function normalizeRow(row: any): PendingRow {
  const spec = (row && typeof row.spec === "object" && row.spec) ? row.spec : (row?.spec ?? null);

  const cam_name = row.cam_name || pickSpecValue(spec, ["cam_name", "name"]) || "(No name)";
  const engine_make = row.engine_make || pickSpecValue(spec, ["engine_make", "make"]) || "—";
  const engine_family = row.engine_family || pickSpecValue(spec, ["engine_family", "family"]) || "—";
  const notes = row.notes || pickSpecValue(spec, ["notes", "note"]) || "—";

  return { ...row, cam_name, engine_make, engine_family, notes, spec };
}

export default function AdminCamReviewPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const sb: SupabaseClient = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      // will render error below
      return null as any;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const [adminState, setAdminState] = useState("Checking admin…");
  const [whoLine, setWhoLine] = useState("");
  const [msg, setMsg] = useState<{ text: string; kind: "" | "ok" | "err" }>({ text: "Initializing…", kind: "" });

  const [pending, setPending] = useState<PendingRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const current = useMemo(() => pending.find(p => p.id === currentId) ?? null, [pending, currentId]);

  async function requireAdmin() {
    const { data: { user }, error: userErr } = await sb.auth.getUser();
    if (userErr) throw userErr;

    if (!user) {
      setAdminState("Not logged in");
      setMsg({ text: "Please log in (this page requires an authenticated admin).", kind: "err" });
      return { ok: false as const };
    }

    const { data: adminRow, error: adminErr } = await sb
      .from(ADMINS_TABLE)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr) throw adminErr;

    if (!adminRow) {
      setAdminState("Not admin");
      setMsg({ text: "You are logged in, but your account is not in cse_admins.", kind: "err" });
      setWhoLine(user.email ? `Logged in: ${user.email}` : `Logged in: ${user.id}`);
      return { ok: false as const, user };
    }

    setAdminState("Admin: OK");
    setWhoLine(user.email ? `Logged in: ${user.email}` : `Logged in: ${user.id}`);
    return { ok: true as const, user };
  }

  async function getPhotoUrl(cam_card_path?: string | null) {
    if (!cam_card_path) return null;
    if (cam_card_path.startsWith("http://") || cam_card_path.startsWith("https://")) return cam_card_path;

    const pub = sb.storage.from(BUCKET_NAME).getPublicUrl(cam_card_path);
    if (pub?.data?.publicUrl) return pub.data.publicUrl;

    const signed = await sb.storage.from(BUCKET_NAME).createSignedUrl(cam_card_path, 60 * 60);
    if (signed?.data?.signedUrl) return signed.data.signedUrl;

    return null;
  }

  async function loadQueue() {
    setLoading(true);
    setMsg({ text: "Loading pending queue…", kind: "" });
    setPhotoUrl(null);

    const { data, error } = await sb
      .from(TABLE)
      .select("id, created_at, cam_name, engine_make, engine_family, notes, cam_card_path, spec, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMsg({ text: "Failed to load queue: " + error.message, kind: "err" });
      setPending([]);
      setCurrentId(null);
      setLoading(false);
      return;
    }

    const rows = (data ?? []).map(normalizeRow);
    setPending(rows);
    setMsg({ text: `Loaded ${rows.length} pending cams.`, kind: "ok" });
    setCurrentId(rows.length ? rows[0].id : null);
    setLoading(false);
  }

  async function selectRow(id: string) {
    setCurrentId(id);
    setDenyReason("");
    setPhotoUrl(null);

    const row = pending.find(p => p.id === id);
    if (!row) return;

    const url = await getPhotoUrl(row.cam_card_path);
    setPhotoUrl(url);
    setMsg({ text: "Ready to approve or deny.", kind: "" });
  }

  async function setStatus(newStatus: "approved" | "denied", reasonText?: string) {
    if (!current?.id) return;
    setLoading(true);
    setMsg({ text: `${newStatus.toUpperCase()}…`, kind: "" });

    const updates: any = { status: newStatus };

    if (newStatus === "denied" && reasonText && reasonText.trim()) {
      const existing = (current.notes && current.notes !== "—") ? String(current.notes) : "";
      updates.notes = (existing ? existing + "\n\n" : "") + `[ADMIN DENIAL]: ${reasonText.trim()}`;
    }

    const { error } = await sb.from(TABLE).update(updates).eq("id", current.id);
    if (error) {
      console.error(error);
      setMsg({ text: "Update failed (likely RLS): " + error.message, kind: "err" });
      setLoading(false);
      return;
    }

    setMsg({ text: `Updated to ${newStatus}.`, kind: "ok" });

    const next = pending.filter(p => p.id !== current.id);
    setPending(next);
    setCurrentId(next.length ? next[0].id : null);
    setDenyReason("");
    setPhotoUrl(null);
    setLoading(false);
  }

  async function signOut() {
    await sb.auth.signOut();
    window.location.href = "/login";
  }

  useEffect(() => {
    (async () => {
      if (!supabaseUrl || !supabaseAnonKey) {
        setMsg({ text: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel env vars.", kind: "err" });
        return;
      }
      try {
        const admin = await requireAdmin();
        if (!admin.ok) return;
        await loadQueue();
      } catch (e: any) {
        console.error(e);
        setMsg({ text: "Error: " + (e?.message || String(e)), kind: "err" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentId) selectRow(currentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  return (
    <div style={{
      minHeight: "100vh",
      margin: 0,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      color: "#e5e7eb",
      background:
        "radial-gradient(circle at 10% 0%, rgba(56,189,248,.18), transparent 45%)," +
        "radial-gradient(circle at 90% 0%, rgba(244,114,182,.16), transparent 45%)," +
        "radial-gradient(circle at 50% 100%, rgba(167,139,250,.12), transparent 55%)," +
        "linear-gradient(180deg, #050816, #020617)"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        <div style={{
          display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "rgba(2,6,23,.65)",
          border: "1px solid rgba(56,189,248,.35)",
          borderRadius: 18,
          boxShadow: "0 18px 46px rgba(0,0,0,.55)",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h1 style={{ margin: 0, fontSize: 15, letterSpacing: ".14em", textTransform: "uppercase", color: "#7dd3fc", fontWeight: 800 }}>
              Cam Spec Elite — Admin Moderation
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#cbd5f5", opacity: .95 }}>
              Review pending cam submissions. Preview photo + specs. Approve or deny in one click.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{
              padding: "7px 10px", borderRadius: 999, border: "1px solid rgba(56,189,248,.35)",
              background: "rgba(2,6,23,.55)", color: "#cbd5f5", fontSize: 12
            }}>
              <strong style={{ color: "#e5e7eb" }}>{adminState}</strong>
            </div>

            <div style={{
              padding: "7px 10px", borderRadius: 999, border: "1px solid rgba(56,189,248,.35)",
              background: "rgba(2,6,23,.55)", color: "#cbd5f5", fontSize: 12
            }}>
              Queue: <strong style={{ color: "#e5e7eb" }}>{pending.length}</strong>
            </div>

            <button
              onClick={loadQueue}
              disabled={loading}
              style={{
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 800,
                letterSpacing: ".04em",
                border: "1px solid rgba(148,163,184,.25)",
                background: "rgba(2,6,23,.55)",
                color: "#e5e7eb",
                opacity: loading ? .6 : 1
              }}
            >
              Refresh Queue
            </button>

            <button
              onClick={signOut}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 800,
                letterSpacing: ".04em",
                color: "#06101a",
                background: "linear-gradient(90deg, rgba(56,189,248,.95), rgba(244,114,182,.9))",
                boxShadow: "0 14px 30px rgba(0,0,0,.45)"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.95fr", gap: 14, marginTop: 14 }}>
          {/* LEFT */}
          <div style={{
            background: "rgba(2,6,23,.75)",
            border: "1px solid rgba(56,189,248,.35)",
            borderRadius: 18,
            boxShadow: "0 18px 46px rgba(0,0,0,.55)",
            backdropFilter: "blur(10px)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              padding: "12px 14px",
              borderBottom: "1px solid rgba(56,189,248,.22)",
              background: "linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))"
            }}>
              <h3 style={{ margin: 0, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "#bfe9ff" }}>
                Pending Queue
              </h3>
              <span style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid rgba(245,158,11,.45)",
                background: "rgba(2,6,23,.45)",
                color: "#fde68a",
                whiteSpace: "nowrap"
              }}>
                pending
              </span>
            </div>

            <div style={{ maxHeight: "calc(100vh - 190px)", overflow: "auto" }}>
              {!pending.length ? (
                <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(148,163,184,.12)" }}>
                  <div style={{ fontWeight: 900, color: "#eaf2ff", fontSize: 13 }}>No pending cams 🎉</div>
                  <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .95, marginTop: 4 }}>Nothing to review right now.</div>
                </div>
              ) : pending.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setCurrentId(r.id)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid rgba(148,163,184,.12)",
                    cursor: "pointer",
                    background: currentId === r.id ? "rgba(244,114,182,.07)" : "transparent",
                    borderLeft: currentId === r.id ? "3px solid rgba(244,114,182,.65)" : "3px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900, color: "#eaf2ff", fontSize: 13 }}>{r.cam_name || "(No name)"}</div>
                    <span style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(245,158,11,.45)",
                      background: "rgba(2,6,23,.45)",
                      color: "#fde68a",
                      whiteSpace: "nowrap"
                    }}>
                      pending
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .95, marginTop: 4 }}>
                    {r.engine_make || "—"} • {r.engine_family || "—"} • {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{
            background: "rgba(2,6,23,.75)",
            border: "1px solid rgba(56,189,248,.35)",
            borderRadius: 18,
            boxShadow: "0 18px 46px rgba(0,0,0,.55)",
            backdropFilter: "blur(10px)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              padding: "12px 14px",
              borderBottom: "1px solid rgba(56,189,248,.22)",
              background: "linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))"
            }}>
              <h3 style={{ margin: 0, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "#bfe9ff" }}>
                Review
              </h3>
              <span style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,.22)",
                background: "rgba(2,6,23,.45)",
                color: "#dbeafe",
                whiteSpace: "nowrap"
              }}>
                {current ? "pending" : "—"}
              </span>
            </div>

            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 14 }}>
              <div style={{
                border: "1px solid rgba(148,163,184,.16)",
                borderRadius: 16,
                background: "rgba(2,6,23,.45)",
                padding: 12
              }}>
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Cam Name
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, color: "#e5e7eb" }}>
                  {current?.cam_name || "Select a cam…"}
                </div>

                <div style={{ height: 10 }} />
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Engine
                </div>
                <div style={{ fontSize: 12, color: "#cbd5f5", opacity: .95, lineHeight: 1.35 }}>
                  {current ? `${current.engine_make || "—"} • ${current.engine_family || "—"}` : "—"}
                </div>

                <div style={{ height: 10 }} />
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Notes
                </div>
                <div style={{ fontSize: 12, color: "#cbd5f5", opacity: .95, lineHeight: 1.35 }}>
                  {current?.notes || "—"}
                </div>

                <div style={{ height: 12 }} />
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Denial Reason (optional)
                </div>
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
                    fontFamily: "inherit",
                    marginTop: 8
                  }}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  <button
                    disabled={!current || loading}
                    onClick={() => setStatus("approved")}
                    style={{
                      cursor: (!current || loading) ? "not-allowed" : "pointer",
                      border: "none",
                      borderRadius: 12,
                      padding: "10px 12px",
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      color: "#04120b",
                      background: "linear-gradient(90deg, rgba(34,197,94,.95), rgba(56,189,248,.85))",
                      opacity: (!current || loading) ? .55 : 1
                    }}
                  >
                    Approve
                  </button>

                  <button
                    disabled={!current || loading}
                    onClick={() => setStatus("denied", denyReason)}
                    style={{
                      cursor: (!current || loading) ? "not-allowed" : "pointer",
                      border: "none",
                      borderRadius: 12,
                      padding: "10px 12px",
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      color: "#1b070a",
                      background: "linear-gradient(90deg, rgba(239,68,68,.95), rgba(244,114,182,.85))",
                      opacity: (!current || loading) ? .55 : 1
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
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      border: "1px solid rgba(148,163,184,.25)",
                      background: "rgba(2,6,23,.55)",
                      color: "#e5e7eb",
                      opacity: photoUrl ? 1 : .55
                    }}
                  >
                    Open Photo
                  </button>
                </div>

                <div style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,.18)",
                  background: "rgba(2,6,23,.55)",
                  color: "#e5e7eb",
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap"
                }}>
                  <span><b style={{ color: "#eaf2ff" }}>Status:</b>{" "}
                    <span style={{ color: msg.kind === "err" ? "#fecaca" : msg.kind === "ok" ? "#bbf7d0" : "#e5e7eb" }}>
                      {msg.text}
                    </span>
                  </span>
                  <span>{whoLine}</span>
                </div>
              </div>

              <div style={{
                border: "1px solid rgba(148,163,184,.16)",
                borderRadius: 16,
                background: "rgba(2,6,23,.45)",
                padding: 12
              }}>
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Cam Card Photo
                </div>

                <div style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(56,189,248,.22)",
                  background: "rgba(2,6,23,.55)",
                  minHeight: 240,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8
                }}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Cam card photo" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                  ) : (
                    <div style={{ fontSize: 12, color: "#cbd5f5", opacity: .9, padding: 10, textAlign: "center" }}>
                      {current ? (
                        <>No photo found OR cam_card_path not saved.<br /><br /><b>cam_card_path:</b> {escapeHtml(current.cam_card_path || "—")}</>
                      ) : (
                        <>Select a cam to preview its uploaded cam card photo.</>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ height: 12 }} />
                <div style={{ fontSize: 11, color: "#cbd5f5", opacity: .9, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Specs (JSON)
                </div>

                <div style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,.16)",
                  background: "rgba(2,6,23,.45)"
                }}>
                  <pre style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: 12,
                    color: "#e5e7eb",
                    lineHeight: 1.35
                  }}>
                    {current ? safeJsonPretty(current.spec) : "—"}
                  </pre>
                </div>
              </div>
            </div>

            <style jsx>{`
              @media (max-width: 980px) {
                div[style*="grid-template-columns: 1.05fr 1.95fr"] { grid-template-columns: 1fr !important; }
                div[style*="grid-template-columns: 1.05fr 1fr"] { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

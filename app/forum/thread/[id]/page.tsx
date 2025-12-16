"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
};

type Post = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type Attachment = {
  id: string;
  thread_id: string | null;
  post_id: string | null;
  user_id: string;
  file_url: string;
  created_at: string;
};

function makeSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const threadId = params?.id;

  const supabase = useMemo(() => makeSupabase(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [replyBody, setReplyBody] = useState("");
  const [busyReply, setBusyReply] = useState(false);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);

  async function loadAll() {
    setStatus("");
    setLoading(true);

    try {
      if (!supabase) {
        setStatus("Missing Supabase env vars (.env.local).");
        setLoading(false);
        return;
      }

      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!u.user) {
        setUserId(null);
        setStatus("Login required to view this thread.");
        setLoading(false);
        return;
      }
      setUserId(u.user.id);

      if (!threadId) {
        setStatus("Missing thread id.");
        setLoading(false);
        return;
      }

      const { data: t, error: terr } = await supabase
        .from("forum_threads")
        .select("id,title,body,created_at,user_id")
        .eq("id", threadId)
        .single();

      if (terr) throw terr;
      setThread(t as Thread);

      const { data: p, error: perr } = await supabase
        .from("forum_posts")
        .select("id,thread_id,user_id,body,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (perr) throw perr;
      setPosts((p as Post[]) ?? []);

      const { data: a, error: aerr } = await supabase
        .from("forum_attachments")
        .select("id,thread_id,post_id,user_id,file_url,created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (aerr) throw aerr;
      setAttachments((a as Attachment[]) ?? []);
    } catch (e: any) {
      setStatus(e?.message ?? "Load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadAll();
    })();

    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => loadAll());
      return () => {
        alive = false;
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, supabase]);

  async function addReply() {
    setStatus("");
    if (!supabase) return setStatus("Missing Supabase env vars.");
    if (!threadId) return setStatus("Missing thread id.");
    if (!replyBody.trim()) return setStatus("Reply cannot be empty.");

    setBusyReply(true);
    try {
      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!u.user) return setStatus("You must be logged in.");

      const { error } = await supabase.from("forum_posts").insert({
        thread_id: threadId,
        user_id: u.user.id,
        body: replyBody.trim(),
      });

      if (error) throw error;

      setReplyBody("");
      await loadAll();
    } catch (e: any) {
      setStatus(e?.message ?? "Reply error");
    } finally {
      setBusyReply(false);
    }
  }

  async function uploadThreadImage() {
    setStatus("");
    if (!supabase) return setStatus("Missing Supabase env vars.");
    if (!threadId) return setStatus("Missing thread id.");
    if (!imgFile) return setStatus("Choose an image first.");

    setBusyUpload(true);
    try {
      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!u.user) return setStatus("You must be logged in.");

      const fd = new FormData();
      fd.append("file", imgFile);

      // This route will be implemented next; for now the UI is wired correctly.
      const res = await fetch("/api/upload/forum", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Upload failed (API route not ready yet).");

      const publicUrl = json.publicUrl as string | undefined;
      if (!publicUrl) throw new Error("Upload succeeded but no publicUrl returned.");

      const { error: insErr } = await supabase.from("forum_attachments").insert({
        thread_id: threadId,
        post_id: null,
        user_id: u.user.id,
        file_url: publicUrl,
      });

      if (insErr) throw insErr;

      setImgFile(null);
      await loadAll();
    } catch (e: any) {
      setStatus(e?.message ?? "Upload error");
    } finally {
      setBusyUpload(false);
    }
  }

  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Thread</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/forum">Back to Forum</Link>
            <Link className="pill" href="/forum/new">New Thread</Link>
          </div>
        </div>

        <hr className="hr" />

        {!supabase ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <p className="small">
                Missing <code>.env.local</code> keys. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          </div>
        ) : null}

        {status ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)", marginTop: 12 }}>
            <div className="card-inner">
              <p className="small">{status}</p>
              {!userId ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  <Link className="pill" href="/login">Go to Login</Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="small">Loading…</p>
        ) : thread ? (
          <>
            <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: "#7dd3fc" }}>
                  {thread.title}
                </div>
                <p className="small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{thread.body}</p>
                <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>
                  {new Date(thread.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <hr className="hr" />

            {/* Thread-level images */}
            <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div className="small" style={{ fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", color: "#fb7185" }}>
                    Images
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label className="pill" style={{ cursor: "pointer" }}>
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
                      />
                    </label>

                    <button className="btn" disabled={busyUpload || !imgFile} onClick={uploadThreadImage}>
                      {busyUpload ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </div>

                <div className="small" style={{ marginTop: 10 }}>
                  {imgFile ? `Selected: ${imgFile.name}` : "No image selected."}
                </div>

                <hr className="hr" />

                {attachments.filter(a => !a.post_id).length === 0 ? (
                  <div className="small">No images yet.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {attachments
                      .filter((a) => !a.post_id)
                      .map((a) => (
                        <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" className="card" style={{ background: "rgba(2,6,23,0.40)" }}>
                          <div className="card-inner">
                            <img
                              src={a.file_url}
                              alt="attachment"
                              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(56,189,248,0.18)" }}
                            />
                            <div className="small" style={{ marginTop: 8, opacity: 0.85 }}>
                              {new Date(a.created_at).toLocaleString()}
                            </div>
                          </div>
                        </a>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="hr" />

            {/* Replies */}
            <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div style={{ fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", fontSize: 12, color: "#7dd3fc" }}>
                  Replies
                </div>

                <hr className="hr" />

                {posts.length === 0 ? (
                  <div className="small">No replies yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {posts.map((p) => (
                      <div key={p.id} className="card" style={{ background: "rgba(2,6,23,0.40)" }}>
                        <div className="card-inner">
                          <div className="small" style={{ opacity: 0.85 }}>
                            {new Date(p.created_at).toLocaleString()}
                          </div>
                          <div className="small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                            {p.body}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="hr" />

                <label className="label">Add Reply</label>
                <textarea
                  className="textarea"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply…"
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button className="btn" disabled={busyReply} onClick={addReply}>
                    {busyReply ? "Posting..." : "Post Reply"}
                  </button>
                  <Link className="pill" href="/forum">Back</Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="small">Thread not found.</div>
        )}
      </div>
    </div>
  );
}

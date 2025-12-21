"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import UserHoverCard from "@/components/UserHoverCard";

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
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [busyReply, setBusyReply] = useState(false);

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

      // Check auth via API instead of getUser()
      let currentUserId: string | null = null;
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          currentUserId = authData.user?.id || null;
        }
      } catch (err) {
        console.error("Failed to check auth:", err);
      }
      setUserId(currentUserId);

      if (!threadId) {
        setStatus("Missing thread id.");
        setLoading(false);
        return;
      }

      // Fetch thread and posts from server API
      const threadRes = await fetch(`/api/forum/thread/${threadId}`);
      if (!threadRes.ok) {
        const errorData = await threadRes.json();
        setStatus(errorData.message || "Error loading thread");
        setLoading(false);
        return;
      }

      const threadData = await threadRes.json();
      setThread(threadData.thread);
      setPosts(threadData.posts || []);
      setAttachments(threadData.attachments || []);
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
    if (!threadId) return setStatus("Missing thread id.");
    if (!replyBody.trim()) return setStatus("Reply cannot be empty.");
    if (!userId) return setStatus("You must be logged in.");

    setBusyReply(true);
    try {
      // Use API endpoint to create reply with server auth
      const res = await fetch(`/api/forum/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          body: replyBody.trim()
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to post reply");
      }

      const replyData = await res.json();
      const postId = replyData.post?.id;

      // If there's an image, upload it with the post_id
      if (replyImage && postId) {
        try {
          const fd = new FormData();
          fd.append("file", replyImage);
          fd.append("thread_id", threadId);
          fd.append("post_id", postId);

          const uploadRes = await fetch("/api/forum/upload", { method: "POST", body: fd });
          const uploadJson = await uploadRes.json();
          
          if (!uploadRes.ok) {
            console.error("Image upload failed:", uploadJson.message);
            // Don't fail the reply if image upload fails
          }
        } catch (err) {
          console.error("Image upload error:", err);
          // Don't fail the reply if image upload fails
        }
      }

      setReplyBody("");
      setReplyImage(null);
      await loadAll();
    } catch (e: any) {
      setStatus(e?.message ?? "Reply error");
    } finally {
      setBusyReply(false);
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
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <UserHoverCard
                    userId={thread.user_id}
                    userName={(thread as any).user_profiles?.forum_handle || "Anonymous"}
                    avatarUrl={(thread as any).user_profiles?.forum_avatar_url}
                    handle={(thread as any).user_profiles?.forum_handle}
                    currentUserId={userId}
                    size="medium"
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "#7dd3fc" }}>
                      {(thread as any).user_profiles?.forum_handle || "Anonymous"}
                    </div>
                    <div className="small" style={{ opacity: 0.85 }}>
                      {new Date(thread.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: "#7dd3fc" }}>
                  {thread.title}
                </div>
                <p className="small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{thread.body}</p>
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
                    {posts.map((p: any) => {
                      const postAttachments = attachments.filter(a => a.post_id === p.id);
                      return (
                        <div key={p.id} className="card" style={{ background: "rgba(2,6,23,0.40)" }}>
                          <div className="card-inner">
                            <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                                  <UserHoverCard
                                    userId={p.user_id}
                                    userName={p.user_profiles?.forum_handle || "Anonymous"}
                                    avatarUrl={p.user_profiles?.forum_avatar_url}
                                    handle={p.user_profiles?.forum_handle}
                                    currentUserId={userId}
                                    size="small"
                                  />
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#7dd3fc" }}>
                                      {p.user_profiles?.forum_handle || "Anonymous"}
                                    </div>
                                    <div className="small" style={{ opacity: 0.85 }}>
                                      {new Date(p.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                                  {p.body}
                                </div>
                              </div>
                              {postAttachments.length > 0 && (
                                <a key={postAttachments[0].id} href={postAttachments[0].file_url} target="_blank" rel="noreferrer" style={{ marginLeft: 16, flexShrink: 0 }}>
                                  <img
                                    src={postAttachments[0].file_url}
                                    alt="attachment"
                                    style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(56,189,248,0.18)" }}
                                  />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

                <label className="label" style={{ marginTop: 10 }}>Attach Image (Optional)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <label className="pill" style={{ cursor: "pointer" }}>
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setReplyImage(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {replyImage && <span className="small">{replyImage.name}</span>}
                </div>

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

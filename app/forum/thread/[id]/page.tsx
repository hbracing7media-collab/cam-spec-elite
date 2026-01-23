"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseInstance } from "@/lib/supabaseSingleton";
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
  file_type?: string;
  created_at: string;
};

type GrudgeMatch = {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: string;
  winner_id: string | null;
  challenger_reaction_ms: number | null;
  opponent_reaction_ms: number | null;
  challenger_quarter_et: number | null;
  challenger_quarter_mph: number | null;
  opponent_quarter_et: number | null;
  opponent_quarter_mph: number | null;
  created_at: string;
  challenger_profile?: { forum_handle: string };
  opponent_profile?: { forum_handle: string };
  winner_profile?: { forum_handle: string };
};

function getSupabaseSafe(): SupabaseClient | null {
  try {
    return getSupabaseInstance();
  } catch {
    return null;
  }
}

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const threadId = params?.id;

  const supabase = useMemo(() => getSupabaseSafe(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [grudgeMatches, setGrudgeMatches] = useState<GrudgeMatch[]>([]);

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
      setGrudgeMatches(threadData.grudgeMatches || []);
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
    console.log("addReply called", { threadId, replyBody: replyBody.trim(), userId, replyImage: replyImage?.name });
    setStatus("");
    if (!threadId) return setStatus("Missing thread id.");
    if (!replyBody.trim()) return setStatus("Reply cannot be empty.");
    if (!userId) return setStatus("You must be logged in.");

    // Validate file before submitting
    if (replyImage) {
      console.log("Validating file:", replyImage.name, replyImage.type, replyImage.size);
      const isImage = replyImage.type.startsWith("image/");
      const isVideo = replyImage.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        console.log("File type rejected");
        return setStatus("Only image and video files are allowed.");
      }
      
      const maxImageSize = 10 * 1024 * 1024;  // 10MB
      const maxVideoSize = 100 * 1024 * 1024; // 100MB
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      
      if (replyImage.size > maxSize) {
        const limitMB = maxSize / (1024 * 1024);
        const fileSizeMB = (replyImage.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `File too large (${fileSizeMB}MB). ${isVideo ? 'Videos' : 'Images'} must be under ${limitMB}MB.`;
        console.log("File size rejected:", errorMsg);
        alert(errorMsg); // Show alert so user definitely sees it
        return setStatus(errorMsg);
      }
    }

    console.log("Validation passed, posting reply...");
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

      // If there's a file, upload using signed URL (bypasses Vercel limits)
      if (replyImage && postId) {
        try {
          // Step 1: Get a signed upload URL from the server
          const urlRes = await fetch("/api/forum/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              thread_id: threadId,
              post_id: postId,
              file_name: replyImage.name,
              file_type: replyImage.type
            })
          });

          const urlData = await urlRes.json();
          
          if (!urlRes.ok) {
            console.error("Failed to get upload URL:", urlData.message);
            setStatus(`Upload failed: ${urlData.message}`);
          } else {
            // Step 2: Upload file directly to Supabase using signed URL
            const uploadRes = await fetch(urlData.signedUrl, {
              method: "PUT",
              headers: {
                "Content-Type": replyImage.type,
              },
              body: replyImage
            });

            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error("Direct upload failed:", errorText);
              setStatus(`Upload failed: ${uploadRes.status}`);
            } else {
              // Step 3: Create attachment record in database
              const attachRes = await fetch("/api/forum/attachment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  thread_id: threadId,
                  post_id: postId,
                  file_url: urlData.publicUrl,
                  file_name: replyImage.name,
                  file_type: replyImage.type
                })
              });

              if (!attachRes.ok) {
                const attachJson = await attachRes.json();
                console.error("Attachment record failed:", attachJson.message);
              }
            }
          }
        } catch (err) {
          console.error("Upload error:", err);
          // Don't fail the reply if upload fails
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
                    threadId={threadId}
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

            {/* Grudge Matches for this thread */}
            {grudgeMatches.length > 0 && (
              <>
                <div className="card" style={{ background: "rgba(2,6,23,0.55)", borderLeft: "3px solid #f97316" }}>
                  <div className="card-inner">
                    <div style={{ fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", fontSize: 12, color: "#f97316", marginBottom: 12 }}>
                      🏁 Grudge Matches
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {grudgeMatches.map((match) => {
                        const isCompleted = match.status === "completed";
                        const isPending = match.status === "pending";
                        const isAccepted = match.status === "accepted";
                        const isWaiting = match.status === "waiting_opponent";
                        
                        return (
                          <div key={match.id} style={{ 
                            background: "rgba(249,115,22,0.1)", 
                            borderRadius: 8, 
                            padding: 12,
                            border: isCompleted ? "1px solid #22c55e" : "1px solid rgba(249,115,22,0.3)"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <div style={{ fontWeight: 700, color: "#f97316" }}>
                                {match.challenger_profile?.forum_handle || "Unknown"} vs {match.opponent_profile?.forum_handle || "Unknown"}
                              </div>
                              <div style={{ 
                                fontSize: 11, 
                                padding: "2px 8px", 
                                borderRadius: 4,
                                background: isCompleted ? "#22c55e" : isPending ? "#eab308" : isAccepted ? "#3b82f6" : "#f97316",
                                color: "#000",
                                fontWeight: 700,
                                textTransform: "uppercase"
                              }}>
                                {isCompleted ? "Finished" : isPending ? "Pending" : isAccepted ? "Accepted" : isWaiting ? "In Progress" : match.status}
                              </div>
                            </div>

                            {isCompleted && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                                {/* Challenger result */}
                                <div style={{ 
                                  background: match.winner_id === match.challenger_id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                                  borderRadius: 6, 
                                  padding: 8,
                                  border: match.winner_id === match.challenger_id ? "1px solid #22c55e" : "1px solid transparent"
                                }}>
                                  <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, marginBottom: 4 }}>
                                    {match.challenger_profile?.forum_handle || "Challenger"}
                                    {match.winner_id === match.challenger_id && <span style={{ color: "#22c55e", marginLeft: 6 }}>🏆 WINNER</span>}
                                  </div>
                                  <div style={{ fontSize: 12, fontFamily: "monospace" }}>
                                    <div>RT: {match.challenger_reaction_ms != null ? (match.challenger_reaction_ms / 1000).toFixed(3) : "-"}s</div>
                                    <div>1/4 ET: {match.challenger_quarter_et?.toFixed(3) || "-"}s</div>
                                    <div>1/4 MPH: {match.challenger_quarter_mph?.toFixed(2) || "-"}</div>
                                  </div>
                                </div>

                                {/* Opponent result */}
                                <div style={{ 
                                  background: match.winner_id === match.opponent_id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                                  borderRadius: 6, 
                                  padding: 8,
                                  border: match.winner_id === match.opponent_id ? "1px solid #22c55e" : "1px solid transparent"
                                }}>
                                  <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700, marginBottom: 4 }}>
                                    {match.opponent_profile?.forum_handle || "Opponent"}
                                    {match.winner_id === match.opponent_id && <span style={{ color: "#22c55e", marginLeft: 6 }}>🏆 WINNER</span>}
                                  </div>
                                  <div style={{ fontSize: 12, fontFamily: "monospace" }}>
                                    <div>RT: {match.opponent_reaction_ms != null ? (match.opponent_reaction_ms / 1000).toFixed(3) : "-"}s</div>
                                    <div>1/4 ET: {match.opponent_quarter_et?.toFixed(3) || "-"}s</div>
                                    <div>1/4 MPH: {match.opponent_quarter_mph?.toFixed(2) || "-"}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!isCompleted && (
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                                {isPending && "⏳ Waiting for opponent to accept..."}
                                {isAccepted && "🏎️ Both racers ready - waiting for first run"}
                                {isWaiting && "🏎️ One racer has finished - waiting for opponent"}
                              </div>
                            )}

                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>
                              {new Date(match.created_at).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <hr className="hr" />
              </>
            )}

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
                                    threadId={threadId}
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
                                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                                  {postAttachments[0].file_type?.startsWith('video/') ? (
                                    <video
                                      src={postAttachments[0].file_url}
                                      controls
                                      style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8, border: "1px solid rgba(56,189,248,0.18)" }}
                                    />
                                  ) : (
                                    <a key={postAttachments[0].id} href={postAttachments[0].file_url} target="_blank" rel="noreferrer">
                                      <img
                                        src={postAttachments[0].file_url}
                                        alt="attachment"
                                        style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(56,189,248,0.18)" }}
                                      />
                                    </a>
                                  )}
                                </div>
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

                <label className="label" style={{ marginTop: 10 }}>Attach Image or Video (Optional)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <label className="pill" style={{ cursor: "pointer" }}>
                    Choose File
                    <input
                      type="file"
                      accept="image/*,video/*"
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

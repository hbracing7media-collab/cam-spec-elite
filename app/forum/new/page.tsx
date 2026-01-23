"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseInstance } from "@/lib/supabaseSingleton";

function getSupabaseSafe(): SupabaseClient | null {
  try {
    return getSupabaseInstance();
  } catch {
    return null;
  }
}

export default function NewThreadPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth via API endpoint (validates auth cookie)
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.user?.id) {
            setUserId(json.user.id);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  async function createThread() {
    setMsg("");
    const supabase = getSupabaseSafe();

    if (!supabase) {
      setMsg("Missing Supabase env vars (.env.local).");
      return;
    }
    if (!title.trim()) {
      setMsg("Title is required.");
      return;
    }
    if (!body.trim()) {
      setMsg("Body is required.");
      return;
    }
    if (!userId) {
      setMsg("You must be logged in.");
      return;
    }

    setBusy(true);
    try {
      // Call server-side API to create thread (passes auth context)
      const res = await fetch("/api/forum/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim()
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to create thread");
      }

      const data = await res.json();
      const threadId = data.thread?.id;
      if (!threadId) throw new Error("Thread created but no id returned.");

      // Go to thread page
      window.location.href = `/forum/thread/${threadId}`;
    } catch (e: any) {
      setMsg(e?.message ?? "Create thread error");
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-inner">
        <h1 className="h1">New Thread</h1>
        <p className="small">Create a discussion thread. Image attachments come next.</p>

        <hr className="hr" />

        {loading ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <p className="small">Loading...</p>
            </div>
          </div>
        ) : !userId ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <p className="small">You must be logged in to create a thread.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Link className="pill" href="/forum">Back to Forum</Link>
                <Link className="pill" href="/auth/login">Login</Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Turbo 351W cam timing question"
            />

            <label className="label" style={{ marginTop: 10 }}>
              Body
            </label>
            <textarea
              className="textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the details here..."
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button className="btn" disabled={busy} onClick={createThread}>
                {busy ? "Creating..." : "Create Thread"}
              </button>
              <Link className="pill" href="/forum">Cancel</Link>
            </div>

            {msg ? <p className="small" style={{ marginTop: 12 }}>{msg}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function makeSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export default function NewThreadPage() {
  const supabase = useMemo(() => makeSupabase(), []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function createThread() {
    setMsg("");

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

    setBusy(true);
    try {
      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (uerr) throw uerr;
      if (!u.user) {
        setMsg("You must be logged in.");
        setBusy(false);
        return;
      }

      const { data, error } = await supabase
        .from("forum_threads")
        .insert({
          user_id: u.user.id,
          title: title.trim(),
          body: body.trim()
        })
        .select("id")
        .single();

      if (error) throw error;

      const threadId = (data as any)?.id as string | undefined;
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

        {!supabase ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <p className="small">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Link className="pill" href="/forum">Back to Forum</Link>
                <Link className="pill" href="/login">Login</Link>
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

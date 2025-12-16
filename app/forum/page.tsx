"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
};

function makeSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export default function ForumPage() {
  const supabase = useMemo(() => makeSupabase(), []);
  const [status, setStatus] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setStatus("");

      if (!supabase) {
        setStatus("Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
        setLoading(false);
        return;
      }

      // auth check
      const { data: u, error: uerr } = await supabase.auth.getUser();
      if (!alive) return;

      if (uerr) {
        setStatus(uerr.message);
        setLoading(false);
        return;
      }

      if (!u.user) {
        setUserEmail(null);
        setThreads([]);
        setStatus("Login required to view the forum.");
        setLoading(false);
        return;
      }

      setUserEmail(u.user.email ?? null);

      // load threads
      const { data, error } = await supabase
        .from("forum_threads")
        .select("id,title,body,created_at,user_id")
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setStatus(error.message);
        setThreads([]);
      } else {
        setThreads((data as Thread[]) ?? []);
      }

      setLoading(false);
    }

    run();

    // update UI on auth changes
    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => run());
      return () => {
        alive = false;
        sub.subscription.unsubscribe();
      };
    }

    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <div className="card">
      <div className="card-inner">
        <h1 className="h1">Forum</h1>
        <p className="small">
          Threads, posts, and images are supported once we wire the upload routes.
        </p>

        <hr className="hr" />

        {!supabase ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <div className="small">
                <b>Setup required:</b> create <code>.env.local</code> with:
                <div style={{ marginTop: 10 }}>
                  <code>
                    NEXT_PUBLIC_SUPABASE_URL=...<br />
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {status ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)", marginTop: 12 }}>
            <div className="card-inner">
              <p className="small">{status}</p>
              {!userEmail ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  <Link className="pill" href="/login">Go to Login</Link>
                  <Link className="pill" href="/">Back Home</Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {userEmail ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div className="small">
              Logged in as <b>{userEmail}</b>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="pill" href="/forum/new">New Thread</Link>
              <Link className="pill" href="/profile">Profile</Link>
            </div>
          </div>
        ) : null}

        <hr className="hr" />

        {loading ? (
          <p className="small">Loading threads…</p>
        ) : userEmail ? (
          threads.length === 0 ? (
            <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
              <div className="card-inner">
                <div className="small">No threads yet. Create the first one.</div>
                <div style={{ marginTop: 10 }}>
                  <Link className="pill" href="/forum/new">Create Thread</Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {threads.map((t) => (
                <Link
                  key={t.id}
                  className="card"
                  href={`/forum/thread/${t.id}`}
                  style={{ background: "rgba(2,6,23,0.55)" }}
                >
                  <div className="card-inner">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, color: "#7dd3fc" }}>
                          {t.title}
                        </div>
                        <div className="small" style={{ marginTop: 6 }}>
                          {t.body?.length > 160 ? t.body.slice(0, 160) + "…" : t.body}
                        </div>
                      </div>
                      <div className="small" style={{ opacity: 0.85 }}>
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : null}

        <hr className="hr" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="pill" href="/">Home</Link>
          <Link className="pill" href="/calculators">Calculators</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function ForumPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
        return;
      }
      // Fetch threads from API route
      const threadsRes = await fetch("/api/forum/threads");
      if (threadsRes.ok) {
        const data = await threadsRes.json();
        setThreads(data.threads || []);
      }
      setChecking(false);
    };
    checkAuthAndLoad();
  }, [router]);

  if (checking) return <div>Loading...</div>;

  return (
    <div className="card">
      <div className="card-inner">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ marginBottom: 0 }}>Forum</h1>
          <Link className="pill" href="/forum/new">
            New Thread
          </Link>
        </div>
        <hr className="hr" />
        {threads.length === 0 ? (
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
        )}
        <hr className="hr" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="pill" href="/">Home</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LayawayBanner from "@/components/LayawayBanner";
import { useTranslations } from "next-intl";

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  user_id: string;
};

export default function ForumPage() {
  const t = useTranslations();
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

  if (checking) return <div>{t('common.loading')}</div>;

  return (
    <div className="card">
      <div className="card-inner">
        <LayawayBanner />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1" style={{ marginBottom: 0 }}>{t('forum.title')}</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/forum/grudge">
              🏎️ {t('forum.grudgeMatch')}
            </Link>
            <Link className="pill" href="/forum/new">
              {t('forum.newThread')}
            </Link>
          </div>
        </div>
        <hr className="hr" />
        {threads.length === 0 ? (
          <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
            <div className="card-inner">
              <div className="small">{t('forum.noThreads')}</div>
              <div style={{ marginTop: 10 }}>
                <Link className="pill" href="/forum/new">{t('forum.createThread')}</Link>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {threads.map((thread: any) => (
              <Link
                key={thread.id}
                className="card"
                href={`/forum/thread/${thread.id}`}
                style={{ background: "rgba(2,6,23,0.55)" }}
              >
                <div className="card-inner">
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    {thread.user_profiles?.forum_avatar_url ? (
                      <img
                        src={thread.user_profiles.forum_avatar_url}
                        alt="avatar"
                        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7dd3fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>
                        {(thread.user_profiles?.forum_handle?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#7dd3fc", fontSize: 12 }}>
                            {thread.user_profiles?.forum_handle || t('forum.anonymous')}
                          </div>
                          <div style={{ fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, color: "#e5e7eb", marginTop: 4 }}>
                            {thread.title}
                          </div>
                        </div>
                        <div className="small" style={{ opacity: 0.85, whiteSpace: "nowrap" }}>
                          {new Date(thread.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="small" style={{ marginTop: 6, opacity: 0.8 }}>
                        {thread.body?.length > 120 ? thread.body.slice(0, 120) + "…" : thread.body}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <hr className="hr" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="pill" href="/">{t('nav.home')}</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LayawayBanner from "@/components/LayawayBanner";
import { useTranslations } from "next-intl";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const t = useTranslations();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      setIsLoggedIn(res.ok);
    };
    checkAuth();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/miami-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 720,
          width: "100%",
          boxShadow: "0 0 40px rgba(0,255,255,0.25)",
          border: "1px solid rgba(0,255,255,0.35)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: 6,
            fontSize: 28,
            letterSpacing: "0.12em",
          }}
        >
          {t('home.title')}
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 24,
          }}
        >
          {t('home.subtitle')}
        </p>

        <LayawayBanner />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <Link href="/profile" className="pill">
            {t('nav.profile')}
          </Link>
          <Link href="/forum" className="pill">
            {t('nav.forum')}
          </Link>
          <Link href="/calculators" className="pill">
            {t('nav.calculators')}
          </Link>
          <Link href="/cams" className="pill">
            {t('nav.cams')}
          </Link>
          <Link href="/cylinder-heads" className="pill">
            {t('nav.cylinderHeads')}
          </Link>
          <Link href="/dyno-wars" className="pill">
            {t('nav.dynoWars')}
          </Link>
          <Link href="/shop" className="pill" style={{ gridColumn: "1 / -1" }}>
            {t('nav.shop')}
          </Link>
        </div>

        <hr className="hr" />

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          {isLoggedIn ? (
            <>
              <Link href="/forum/new" className="pill small">
                {t('forum.newThread')}
              </Link>
              <Link href="/logout" className="pill small">
                {t('nav.logout')}
              </Link>
            </>
          ) : (
            <Link href="/auth/login" className="pill small">
              {t('auth.login')}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

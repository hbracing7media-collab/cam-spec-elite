"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  if (checking) return <div>Loading...</div>;

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
          maxWidth: 520,
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
          CAM SPEC ELITE
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            opacity: 0.85,
            marginBottom: 24,
          }}
        >
          Performance calculators • forum • build data
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <Link href="/profile" className="pill">
            Profile
          </Link>
          <Link href="/forum" className="pill">
            Forum
          </Link>
          <Link href="/calculators" className="pill">
            Calculators
          </Link>
          <Link href="/cams" className="pill">
            Browse Cams
          </Link>
          <Link href="/cylinder-heads" className="pill">
            Heads
          </Link>
          <Link href="/dyno-wars" className="pill">
            Dyno Wars
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
          <Link href="/forum/new" className="pill small">
            New Thread
          </Link>
          <Link href="/logout" className="pill small">
            Logout
          </Link>
        </div>
      </div>
    </main>
  );
}

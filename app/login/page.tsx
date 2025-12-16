"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error || "Login failed");
        setLoading(false);
        return;
      }

      // Cookie should now exist (server wrote it)
      router.push("/forum");
      router.refresh();
    } catch {
      setMsg("Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ width: "min(520px, 100%)", borderRadius: 18, border: "1px solid rgba(56,189,248,0.35)", padding: 18, background: "rgba(2,6,23,0.72)", boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
        <h1 style={{ margin: 0, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase" }}>Cam Spec Elite</h1>
        <p style={{ marginTop: 8, marginBottom: 16, opacity: 0.85, fontSize: 12 }}>Sign in to manage your builds, uploads, and forum.</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.35)", color: "white" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.35)", color: "white" }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid rgba(34,211,238,0.45)",
              background: "linear-gradient(90deg, rgba(236,72,153,0.35), rgba(34,211,238,0.25))",
              color: "white",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {msg ? (
            <div style={{ marginTop: 6, fontSize: 12, padding: 10, borderRadius: 12, background: "rgba(255,0,80,0.12)", border: "1px solid rgba(255,0,80,0.25)" }}>
              {msg}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LayawayBanner from "@/components/LayawayBanner";

interface Message {
  type: "ok" | "err";
  text: string;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (!email.trim() || !password.trim()) {
      setMsg({ type: "err", text: "Email and password required." });
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setMsg({ type: "err", text: "Passwords do not match." });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMsg({ type: "err", text: "Password must be at least 6 characters." });
        setLoading(false);
        return;
      }
      
      // Use server endpoint for signup with email confirmation
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json();
        
        if (!res.ok) {
          setMsg({ type: "err", text: result.message || "Signup failed." });
          setLoading(false);
          return;
        }
        
        setMsg({ 
          type: "ok", 
          text: "Signup successful! Please check your email to confirm your account." 
        });
        setTimeout(() => setMode("login"), 3000);
      } catch (err) {
        setMsg({
          type: "err",
          text: err instanceof Error ? err.message : "Signup failed.",
        });
      }
      setLoading(false);
      return;
    }

    // LOGIN: Use server API to set cookies
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) {
      setMsg({ type: "err", text: result.message || "Login failed." });
      setLoading(false);
      return;
    }
    setMsg({ type: "ok", text: "Login successful! Redirecting..." });
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <LayawayBanner />
      <div
        style={{
          borderRadius: 18,
          padding: 30,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          width: "100%",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 20,
            color: "#7dd3fc",
          }}
        >
          {mode === "login" ? "Login" : "Sign Up"}
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: "rgba(226,232,240,0.8)",
            fontSize: 13,
          }}
        >
          {mode === "login"
            ? "Access your cam submissions."
            : "Create your account to submit cams."}
        </p>

        {msg && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              background:
                msg.type === "err"
                  ? "rgba(251, 113, 133, 0.2)"
                  : "rgba(134, 239, 172, 0.2)",
              color: msg.type === "err" ? "#fb7185" : "#86efac",
              fontSize: 12,
              border:
                msg.type === "err"
                  ? "1px solid rgba(251, 113, 133, 0.5)"
                  : "1px solid rgba(134, 239, 172, 0.5)",
            }}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#7dd3fc",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#7dd3fc",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {mode === "signup" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#7dd3fc",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 13,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.5)",
              background: loading
                ? "rgba(100,116,139,0.25)"
                : "rgba(56,189,248,0.2)",
              color: "#7dd3fc",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating..."
              : mode === "login"
                ? "Login"
                : "Sign Up"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 12,
            color: "rgba(226,232,240,0.7)",
          }}
        >
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                style={{
                  color: "#7dd3fc",
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                style={{
                  color: "#7dd3fc",
                  textDecoration: "underline",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
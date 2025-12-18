"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  email: string;
  forum_handle?: string;
  forum_avatar_url?: string;
  [key: string]: any;
}

export default function ProfilePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [forumHandle, setForumHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        const data = await res.json();
        setUser(data.user);
        setForumHandle(data.user.forum_handle || "");
        setAvatarUrl(data.user.forum_avatar_url || "");
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAvatarUrl(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("forum_handle", forumHandle);
    if (avatarFile) {
      formData.append("forum_avatar", avatarFile);
    }

    const res = await fetch("/api/profile/update", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (res.ok) {
      setMsg("Profile updated!");
      if (result.forum_avatar_url) setAvatarUrl(result.forum_avatar_url);
      setUser((u) =>
        u
          ? { ...u, forum_handle: forumHandle, forum_avatar_url: result.forum_avatar_url || avatarUrl }
          : u
      );
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setMsg(result.message || "Failed to update profile.");
    }
    setSaving(false);
  };

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.10), rgba(15,23,42,0.92))",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          padding: 36,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "rgba(2,6,23,0.85)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          width: 380,
          maxWidth: "90vw",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontSize: 22,
            color: "#7dd3fc",
            textAlign: "center",
          }}
        >
          Profile
        </h1>
        <div
          style={{
            marginBottom: 24,
            textAlign: "center",
            color: "rgba(226,232,240,0.85)",
            fontSize: 15,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "#7dd3fc" }}>Email:</span>
            <br />
            {user?.email}
          </div>
        </div>

        <form onSubmit={handleSave} style={{ marginBottom: 18 }}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#7dd3fc",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Forum Handle
            </label>
            <input
              type="text"
              value={forumHandle}
              onChange={(e) => setForumHandle(e.target.value)}
              placeholder="Your forum handle"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#7dd3fc",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Forum Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{
                width: "100%",
                padding: "8px 0",
                color: "#e2e8f0",
                background: "rgba(2,6,23,0.6)",
                border: "none",
              }}
            />
          </div>
          {avatarUrl && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <img
                src={avatarUrl}
                alt="Forum Avatar"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #7dd3fc",
                  background: "#0e172a",
                  margin: "0 auto",
                }}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.5)",
              background: saving
                ? "rgba(100,116,139,0.25)"
                : "rgba(56,189,248,0.2)",
              color: "#7dd3fc",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              marginBottom: 4,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {msg && (
            <div
              style={{
                marginTop: 10,
                color: msg === "Profile updated!" ? "#86efac" : "#fb7185",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {msg}
            </div>
          )}
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/">
            <button
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "rgba(56,189,248,0.15)",
                color: "#7dd3fc",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 4,
              }}
            >
              Home
            </button>
          </Link>
          <Link href="/logout">
            <button
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "1px solid rgba(251,113,133,0.5)",
                background: "rgba(251,113,133,0.13)",
                color: "#fb7185",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function UploadHubPage() {
  return (
    <main style={{ padding: 18, maxWidth: 980, margin: "0 auto", color: "#e2e8f0" }}>
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          border: "1px solid rgba(56,189,248,0.35)",
          background: "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), rgba(15,23,42,0.92))",
          boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 16, color: "#7dd3fc" }}>
          Uploads
        </h1>

        <p style={{ marginTop: 8, marginBottom: 14, color: "rgba(226,232,240,0.9)", fontSize: 12 }}>
          Use “Submit Cam” to enter specs + upload cam card and dyno sheets (admin approval required).
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <BigBtn href="/cams/new">Submit Cam (Specs + Files)</BigBtn>
          <BigBtn href="/api/admin/storage/pending">Admin Pending (JSON)</BigBtn>
          <BigBtn href="/forum">Back to Forum</BigBtn>
        </div>
      </div>
    </main>
  );
}

function BigBtn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid rgba(34,211,238,0.35)",
        background: "rgba(2,6,23,0.55)",
        color: "#e2e8f0",
        fontWeight: 900,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: 12,
      }}
    >
      {children}
    </Link>
  );
}

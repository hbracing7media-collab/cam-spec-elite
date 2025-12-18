"use client";

import Link from "next/link";

export default function CamsHub() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 20, color: "#e5e7eb", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#7dd3fc", marginBottom: 24 }}>Cams</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Browse Cams */}
        <div
          style={{
            borderRadius: 18,
            padding: 30,
            border: "1px solid rgba(56,189,248,0.35)",
            background: "radial-gradient(circle at 20% 10%, rgba(56,189,248,0.16), rgba(15,23,42,0.92))",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "#7dd3fc", fontSize: 18 }}>Browse Cams</h2>
            <p style={{ color: "rgba(226,232,240,0.8)", fontSize: 13, margin: "0 0 20px 0" }}>
              Explore approved cam specifications by engine make and family.
            </p>
          </div>
          <Link href="/cams/browse/all" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "rgba(56,189,248,0.2)",
                color: "#7dd3fc",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
              }}
            >
              Browse Cams
            </button>
          </Link>
        </div>

        {/* Submit Cam */}
        <div
          style={{
            borderRadius: 18,
            padding: 30,
            border: "1px solid rgba(34,197,94,0.35)",
            background: "radial-gradient(circle at 20% 10%, rgba(34,197,94,0.16), rgba(15,23,42,0.92))",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "#86efac", fontSize: 18 }}>Submit Cam</h2>
            <p style={{ color: "rgba(226,232,240,0.8)", fontSize: 13, margin: "0 0 20px 0" }}>
              Submit your cam specifications for admin review and database inclusion.
            </p>
          </div>
          <Link href="/cams/new" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(34,197,94,0.5)",
                background: "rgba(34,197,94,0.2)",
                color: "#86efac",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
              }}
            >
              Submit Cam
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

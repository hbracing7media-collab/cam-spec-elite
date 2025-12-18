"use client";

import Link from "next/link";

export default function CylinderHeadsHub() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 20, color: "#e5e7eb", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#d8b4fe", marginBottom: 24 }}>Cylinder Heads</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Browse Cylinder Heads */}
        <div
          style={{
            borderRadius: 18,
            padding: 30,
            border: "1px solid rgba(168,85,247,0.35)",
            background: "radial-gradient(circle at 20% 10%, rgba(168,85,247,0.16), rgba(15,23,42,0.92))",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "#d8b4fe", fontSize: 18 }}>Browse Heads</h2>
            <p style={{ color: "rgba(226,232,240,0.8)", fontSize: 13, margin: "0 0 20px 0" }}>
              Explore approved cylinder head specifications with flow charts and performance data.
            </p>
          </div>
          <Link href="/cylinder-heads/browse/all" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(168,85,247,0.5)",
                background: "rgba(168,85,247,0.2)",
                color: "#d8b4fe",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                textTransform: "uppercase",
              }}
            >
              Browse Heads
            </button>
          </Link>
        </div>

        {/* Submit Cylinder Head */}
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
            <h2 style={{ margin: "0 0 12px 0", color: "#86efac", fontSize: 18 }}>Submit Head</h2>
            <p style={{ color: "rgba(226,232,240,0.8)", fontSize: 13, margin: "0 0 20px 0" }}>
              Submit your cylinder head specifications with flow data for admin review.
            </p>
          </div>
          <Link href="/cylinder-heads/submit" style={{ textDecoration: "none" }}>
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
              Submit Head
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

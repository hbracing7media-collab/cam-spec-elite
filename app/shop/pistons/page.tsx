"use client";

import Link from "next/link";

export default function PistonsPage() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      <Link 
        href="/shop" 
        style={{ 
          color: "#00f5ff", 
          textDecoration: "none", 
          fontSize: 14, 
          display: "inline-block",
          marginBottom: 20,
        }}
      >
        ← Back to Shop
      </Link>

      <div style={{
        textAlign: "center",
        marginBottom: 48,
        padding: "60px 20px",
        background: "linear-gradient(135deg, rgba(255, 50, 100, 0.1), rgba(255, 0, 80, 0.05))",
        borderRadius: 16,
        border: "1px solid rgba(255, 50, 100, 0.3)",
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔴</div>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#ff3264",
          margin: "0 0 16px 0",
          letterSpacing: "0.05em",
        }}>
          Pistons
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 18, margin: "0 0 24px 0", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Forged, hypereutectic, and racing pistons from top brands.
          Complete piston & ring kits for your build.
        </p>
        
        <div style={{
          background: "rgba(255, 50, 100, 0.15)",
          border: "1px solid rgba(255, 50, 100, 0.4)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          margin: "0 auto",
        }}>
          <h3 style={{ color: "#ff3264", margin: "0 0 12px 0", fontSize: 18 }}>
            🚧 Coming Soon
          </h3>
          <p style={{ color: "#94a3b8", margin: "0 0 16px 0", fontSize: 14 }}>
            We&apos;re building out our piston catalog. Contact us for custom quotes on:
          </p>
          <ul style={{ color: "#e2e8f0", textAlign: "left", margin: "0 0 20px 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li>JE Pistons</li>
            <li>Wiseco</li>
            <li>Diamond Racing</li>
            <li>Mahle Motorsport</li>
            <li>Ross Racing Pistons</li>
            <li>CP-Carrillo</li>
          </ul>
          <a
            href="mailto:hbracing77@yahoo.com?subject=Piston Quote Request"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #ff3264, #ff6496)",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Request a Quote →
          </a>
        </div>
      </div>
    </main>
  );
}

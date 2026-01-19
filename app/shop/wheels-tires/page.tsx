"use client";

import Link from "next/link";

export default function WheelsTiresPage() {
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
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.05))",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛞</div>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#e0e0e0",
          margin: "0 0 16px 0",
          letterSpacing: "0.05em",
        }}>
          Wheels & Tires
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 18, margin: "0 0 24px 0", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Drag radials, slicks, skinnies, and racing wheels.
          Get the right rubber for your combo.
        </p>
        
        <div style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          margin: "0 auto",
        }}>
          <h3 style={{ color: "#e0e0e0", margin: "0 0 12px 0", fontSize: 18 }}>
            🚧 Coming Soon
          </h3>
          <p style={{ color: "#94a3b8", margin: "0 0 16px 0", fontSize: 14 }}>
            We&apos;re building out our wheels & tires catalog. Contact us for custom quotes on:
          </p>
          <ul style={{ color: "#e2e8f0", textAlign: "left", margin: "0 0 20px 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li>Mickey Thompson ET Street R / S/S</li>
            <li>Nitto NT555R II / NT05R</li>
            <li>M/T Pro Bracket Radials</li>
            <li>Hoosier Drag Slicks</li>
            <li>Weld Racing Wheels</li>
            <li>Race Star Wheels</li>
            <li>Bogart Racing Wheels</li>
          </ul>
          <a
            href="mailto:hbracing77@yahoo.com?subject=Wheels & Tires Quote Request"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #a0a0a0, #d0d0d0)",
              color: "#1a1a2e",
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

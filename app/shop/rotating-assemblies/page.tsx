"use client";

import Link from "next/link";

export default function RotatingAssembliesPage() {
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
        background: "linear-gradient(135deg, rgba(50, 150, 255, 0.1), rgba(0, 100, 255, 0.05))",
        borderRadius: 16,
        border: "1px solid rgba(50, 150, 255, 0.3)",
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚙️</div>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#3296ff",
          margin: "0 0 16px 0",
          letterSpacing: "0.05em",
        }}>
          Rotating Assemblies & Bottom End
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 18, margin: "0 0 24px 0", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Crankshafts, connecting rods, bearings, and complete rotating assembly kits
          for street to all-out race builds.
        </p>
        
        <div style={{
          background: "rgba(50, 150, 255, 0.15)",
          border: "1px solid rgba(50, 150, 255, 0.4)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          margin: "0 auto",
        }}>
          <h3 style={{ color: "#3296ff", margin: "0 0 12px 0", fontSize: 18 }}>
            🚧 Coming Soon
          </h3>
          <p style={{ color: "#94a3b8", margin: "0 0 16px 0", fontSize: 14 }}>
            We&apos;re building out our rotating assembly catalog. Contact us for custom quotes on:
          </p>
          <ul style={{ color: "#e2e8f0", textAlign: "left", margin: "0 0 20px 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li>Scat Crankshafts & Rotating Assemblies</li>
            <li>Eagle Specialty Products</li>
            <li>Callies Performance</li>
            <li>K1 Technologies</li>
            <li>Lunati Rotating Assemblies</li>
            <li>Clevite & King Bearings</li>
            <li>ARP Fasteners</li>
          </ul>
          <a
            href="mailto:hbracing77@yahoo.com?subject=Rotating Assembly Quote Request"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #3296ff, #64b4ff)",
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

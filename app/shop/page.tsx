"use client";

import { useState } from "react";
import Link from "next/link";

interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "apparel" | "stickers" | "accessories";
}

const merchItems: MerchItem[] = [
  {
    id: "tee-classic",
    name: "HB Racing 7 Classic Tee",
    description: "Premium cotton tee with HB Racing 7 logo. Dark Miami Neon style.",
    price: 29.99,
    image: "👕",
    category: "apparel",
  },
  {
    id: "hoodie-neon",
    name: "Neon Nights Hoodie",
    description: "Cozy hoodie with glow-effect HB Racing logo on back.",
    price: 54.99,
    image: "🧥",
    category: "apparel",
  },
  {
    id: "hat-snapback",
    name: "Racing Snapback",
    description: "Adjustable snapback cap with embroidered logo.",
    price: 24.99,
    image: "🧢",
    category: "apparel",
  },
  {
    id: "sticker-pack",
    name: "Sticker Pack (5pc)",
    description: "Vinyl die-cut stickers. Weather resistant, perfect for toolboxes.",
    price: 9.99,
    image: "🏷️",
    category: "stickers",
  },
  {
    id: "decal-windshield",
    name: "Windshield Banner",
    description: '36" vinyl windshield banner. Available in multiple colors.',
    price: 19.99,
    image: "🚗",
    category: "stickers",
  },
  {
    id: "keychain",
    name: "Piston Keychain",
    description: "Metal piston keychain with HB Racing 7 engraving.",
    price: 14.99,
    image: "🔑",
    category: "accessories",
  },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredItems = selectedCategory === "all" 
    ? merchItems 
    : merchItems.filter(item => item.category === selectedCategory);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      {/* Back link */}
      <Link 
        href="/" 
        style={{ 
          color: "#00f5ff", 
          textDecoration: "none", 
          fontSize: 14, 
          display: "inline-block",
          marginBottom: 20,
        }}
      >
        ← Back to Home
      </Link>

      {/* Hero Section */}
      <div style={{
        textAlign: "center",
        marginBottom: 48,
        padding: "40px 20px",
        background: "linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 59, 212, 0.1))",
        borderRadius: 16,
        border: "1px solid rgba(0, 245, 255, 0.2)",
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          background: "linear-gradient(135deg, #00f5ff, #ff3bd4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 12px 0",
            letterSpacing: "0.05em",
          }}>
            Shop & Support
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16, margin: 0, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            Rep the HB Racing 7 crew and help keep the servers running. 
            Every purchase supports development of new features.
          </p>
        </div>

        {/* Donation Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginBottom: 48,
        }}>
          {/* PayPal */}
          <div style={{
            background: "rgba(10, 10, 30, 0.8)",
            border: "1px solid rgba(0, 112, 186, 0.4)",
            borderRadius: 12,
            padding: 24,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
            <h3 style={{ color: "#00f5ff", fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>
              PayPal Donation
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
              One-time or recurring support via PayPal
            </p>
            <a
              href="https://paypal.me/HBRacing7"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "rgba(0, 112, 186, 0.2)",
                color: "#0070ba",
                border: "1px solid rgba(0, 112, 186, 0.4)",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              @HBRacing7
            </a>
          </div>
        </div>

        {/* Merch Section */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            color: "#e2e8f0",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span>🛒</span> Merch
          </h2>

          {/* Category Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {["all", "apparel", "stickers", "accessories"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: selectedCategory === cat 
                    ? "rgba(0, 245, 255, 0.2)" 
                    : "rgba(50, 50, 70, 0.3)",
                  color: selectedCategory === cat ? "#00f5ff" : "#94a3b8",
                  border: `1px solid ${selectedCategory === cat ? "rgba(0, 245, 255, 0.4)" : "rgba(100, 100, 120, 0.3)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
          }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "rgba(10, 10, 30, 0.8)",
                  border: "1px solid rgba(100, 100, 120, 0.3)",
                  borderRadius: 12,
                  padding: 20,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{
                  fontSize: 64,
                  textAlign: "center",
                  marginBottom: 12,
                  filter: "drop-shadow(0 0 10px rgba(0, 245, 255, 0.3))",
                }}>
                  {item.image}
                </div>
                <h3 style={{
                  color: "#e2e8f0",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: "0 0 6px 0",
                }}>
                  {item.name}
                </h3>
                <p style={{
                  color: "#64748b",
                  fontSize: 12,
                  margin: "0 0 12px 0",
                  lineHeight: 1.4,
                }}>
                  {item.description}
                </p>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{
                    color: "#22c55e",
                    fontSize: 18,
                    fontWeight: 700,
                  }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    style={{
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(255, 59, 212, 0.15)",
                      color: "#ff3bd4",
                      border: "1px solid rgba(255, 59, 212, 0.3)",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                    onClick={() => alert("Merch store coming soon! Contact us on the forum for now.")}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          textAlign: "center",
          padding: "24px",
          borderTop: "1px solid rgba(100, 100, 120, 0.2)",
          marginTop: 40,
        }}>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Questions about orders or want to suggest new merch? Hit us up on the{" "}
            <a href="/forum" style={{ color: "#00f5ff", textDecoration: "none" }}>forum</a>!
          </p>
        </div>
    </main>
  );
}

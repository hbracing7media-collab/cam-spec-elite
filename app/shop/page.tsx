"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import LayawayBanner from "@/components/LayawayBanner";

interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  imageBack?: string;  // Optional back image for apparel
  isRealImage?: boolean;  // Flag for actual images vs emojis
  category: "apparel" | "stickers" | "accessories";
  sizes?: string[];  // Available sizes for apparel
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image: string;
}

const SHIPPING_COST = 5.99;

const merchItems: MerchItem[] = [
  {
    id: "tee-windsor-warriors",
    name: "Windsor Warriors Tee",
    description: "Premium black tee. HB Racing 7 logo on front, twin-turbo Windsor engine on back.",
    price: 35.00,
    image: "/shop/windsor-warrior-front.png",
    imageBack: "/shop/windsor-warrior-back.png",
    isRealImage: true,
    category: "apparel",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "tee-race-fam",
    name: "Race Fam Tee",
    description: "Premium black tee with Race Fam design. Front and back print.",
    price: 35.00,
    image: "/shop/race-fam-front.png",
    imageBack: "/shop/race-fam-back.png",
    isRealImage: true,
    category: "apparel",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "tee-shadow",
    name: "Shadow Tee",
    description: "Premium black tee with Shadow design. Front and back print.",
    price: 35.00,
    image: "/shop/shadow-front.png",
    imageBack: "/shop/shadow-back.png",
    isRealImage: true,
    category: "apparel",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "hoodie-neon",
    name: "Miami Vibe Hoodie",
    description: "Cozy hoodie with HB Racing 7 Miami neon style design.",
    price: 62.00,
    image: "/shop/hoodie-miami-vibe.png",
    isRealImage: true,
    category: "apparel",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "hat-snapback",
    name: "Racing Snapback",
    description: "Adjustable snapback cap with embroidered HB Racing 7 logo.",
    price: 35.00,
    image: "/shop/hat-snapback.png",
    isRealImage: true,
    category: "apparel",
  },
  {
    id: "hat-boonie",
    name: "Boonie Hat",
    description: "HB Racing 7 boonie hat. Perfect for the track or outdoors.",
    price: 54.00,
    image: "/shop/boonie-hat.png",
    isRealImage: true,
    category: "apparel",
  },
  {
    id: "hat-beanie",
    name: "HBR7 Beanie",
    description: "Keep warm at the track with the HB Racing 7 beanie.",
    price: 30.00,
    image: "/shop/beanie-hbr7.png",
    isRealImage: true,
    category: "apparel",
  },
  {
    id: "hat-baseball",
    name: "Baseball Cap",
    description: "Classic baseball cap with HB Racing 7 embroidered logo.",
    price: 23.00,
    image: "/shop/hat-baseball.png",
    isRealImage: true,
    category: "apparel",
  },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; hasBack?: boolean; backSrc?: string } | null>(null);
  const [showingBack, setShowingBack] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("hbr-cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("hbr-cart", JSON.stringify(cart));
  }, [cart]);

  const filteredItems = selectedCategory === "all" 
    ? merchItems 
    : merchItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MerchItem) => {
    const size = item.sizes ? selectedSizes[item.id] : undefined;
    if (item.sizes && !size) {
      alert("Please select a size first!");
      return;
    }
    
    const cartItemId = size ? `${item.id}-${size}` : item.id;
    
    setCart(prevCart => {
      const existing = prevCart.find(ci => ci.id === cartItemId);
      if (existing) {
        return prevCart.map(ci => 
          ci.id === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, {
        id: cartItemId,
        name: item.name,
        price: item.price,
        quantity: 1,
        size,
        image: item.image,
      }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(ci => ci.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prevCart => prevCart.map(ci => {
      if (ci.id === cartItemId) {
        const newQty = ci.quantity + delta;
        return newQty > 0 ? { ...ci, quantity: newQty } : ci;
      }
      return ci;
    }).filter(ci => ci.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      {/* Cart Sidebar */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
        />
      )}
      <div style={{
        position: "fixed",
        top: 0,
        right: cartOpen ? 0 : -400,
        width: 380,
        height: "100vh",
        background: "rgba(10, 10, 30, 0.98)",
        borderLeft: "1px solid rgba(0, 245, 255, 0.3)",
        zIndex: 1001,
        transition: "right 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ padding: 20, borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>
              🛒 Cart ({cartCount})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {cart.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>
              Your cart is empty
            </p>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{
                display: "flex",
                gap: 12,
                padding: 12,
                background: "rgba(30, 30, 50, 0.5)",
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <div style={{ width: 60, height: 60, position: "relative", borderRadius: 6, overflow: "hidden" }}>
                  <Image src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, margin: "0 0 4px 0" }}>
                    {item.name}
                  </h4>
                  {item.size && (
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 4px 0" }}>
                      Size: {item.size}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: 24,
                        height: 24,
                        background: "rgba(100, 100, 120, 0.3)",
                        border: "none",
                        borderRadius: 4,
                        color: "#e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <span style={{ color: "#e2e8f0", fontSize: 14 }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: 24,
                        height: 24,
                        background: "rgba(100, 100, 120, 0.3)",
                        border: "none",
                        borderRadius: 4,
                        color: "#e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <span style={{ color: "#22c55e", fontSize: 14, fontWeight: 600, marginLeft: "auto" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: 20, borderTop: "1px solid rgba(100, 100, 120, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Subtotal:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Shipping:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>
                ${SHIPPING_COST.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Tax:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>
                Calculated at checkout
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingTop: 8, borderTop: "1px solid rgba(100, 100, 120, 0.2)" }}>
              <span style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}>Estimate:</span>
              <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 700 }}>
                ${(cartTotal + SHIPPING_COST).toFixed(2)}+tax
              </span>
            </div>
            <Link
              href="/shop/checkout"
              onClick={() => setCartOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #00f5ff, #ff3bd4)",
                color: "#0a0a1e",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00f5ff, #ff3bd4)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 4px 20px rgba(0, 245, 255, 0.4)",
          zIndex: 998,
        }}
      >
        🛒
        {cartCount > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "#ef4444",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            width: 22,
            height: 22,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {cartCount}
          </span>
        )}
      </button>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => { setLightboxImage(null); setShowingBack(false); }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              src={showingBack && lightboxImage.backSrc ? lightboxImage.backSrc : lightboxImage.src}
              alt={lightboxImage.alt}
              width={600}
              height={600}
              style={{
                objectFit: "contain",
                maxHeight: "80vh",
                width: "auto",
                borderRadius: 8,
              }}
            />
            {lightboxImage.hasBack && (
              <button
                onClick={() => setShowingBack(!showingBack)}
                style={{
                  marginTop: 16,
                  padding: "10px 24px",
                  background: "rgba(0, 245, 255, 0.2)",
                  color: "#00f5ff",
                  border: "1px solid rgba(0, 245, 255, 0.4)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {showingBack ? "← View Front" : "View Back →"}
              </button>
            )}
            <p style={{ color: "#94a3b8", marginTop: 12, fontSize: 13 }}>
              Click outside to close
            </p>
          </div>
        </div>
      )}

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

      {/* Layaway Banner */}
      <LayawayBanner />

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

        {/* Parts Store Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {/* Camshafts */}
          <Link
            href="/shop/camshafts"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 200, 200, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(0, 255, 255, 0.3)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0ff", margin: "0 0 8px 0" }}>
              Camshafts
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              Anderson Ford Motorsport, Comp Cams & more
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(0, 255, 255, 0.2)",
              borderRadius: 6,
              color: "#0ff",
              fontWeight: 600,
              fontSize: 13,
            }}>
              Shop Cams →
            </span>
          </Link>

          {/* Cylinder Heads */}
          <Link
            href="/shop/cylinder-heads"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(200, 0, 200, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(255, 0, 255, 0.3)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ width: 80, height: 80, margin: "0 auto 8px", position: "relative" }}>
              <Image
                src="/shop/SBC-heads-AFR.webp"
                alt="AFR Cylinder Heads"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f0f", margin: "0 0 8px 0" }}>
              Cylinder Heads
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              AFR, Trick Flow - SBC, SBF, LS, BBC, Hemi
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(255, 0, 255, 0.2)",
              borderRadius: 6,
              color: "#f0f",
              fontWeight: 600,
              fontSize: 13,
            }}>
              Shop Heads →
            </span>
          </Link>

          {/* All Parts */}
          <Link
            href="/shop/parts"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(0, 255, 0, 0.3)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔧</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f0", margin: "0 0 8px 0" }}>
              All Performance Parts
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              Browse entire catalog - dropship available
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(0, 255, 0, 0.2)",
              borderRadius: 6,
              color: "#0f0",
              fontWeight: 600,
              fontSize: 13,
            }}>
              Browse All →
            </span>
          </Link>

          {/* Fuel Delivery */}
          <Link
            href="/shop/fuel-delivery"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(255, 100, 50, 0.1), rgba(255, 60, 0, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(255, 100, 50, 0.3)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>⛽</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ff6432", margin: "0 0 8px 0" }}>
              Fuel Delivery
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              Injectors, pumps, rails, regulators & E85 parts
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(255, 100, 50, 0.2)",
              borderRadius: 6,
              color: "#ff6432",
              fontWeight: 600,
              fontSize: 13,
            }}>
              Shop Fuel →
            </span>
          </Link>

          {/* Engine Management */}
          <Link
            href="/shop/engine-management"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(150, 50, 255, 0.1), rgba(100, 0, 255, 0.05))",
              borderRadius: 12,
              border: "1px solid rgba(150, 50, 255, 0.3)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🖥️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#9632ff", margin: "0 0 8px 0" }}>
              Engine Management
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              ECUs, wideband controllers, sensors & tuning
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(150, 50, 255, 0.2)",
              borderRadius: 6,
              color: "#9632ff",
              fontWeight: 600,
              fontSize: 13,
            }}>
              Shop EMS →
            </span>
          </Link>

          {/* Machine Shop Services */}
          <Link
            href="/shop/services"
            style={{
              display: "block",
              padding: "24px",
              background: "linear-gradient(135deg, rgba(255, 200, 0, 0.15), rgba(255, 150, 0, 0.08))",
              borderRadius: 12,
              border: "1px solid rgba(255, 200, 0, 0.4)",
              textDecoration: "none",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏭</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffc800", margin: "0 0 8px 0" }}>
              Machine Shop Services
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0" }}>
              Engine building, porting, balancing & more
            </p>
            <span style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "rgba(255, 200, 0, 0.2)",
              borderRadius: 6,
              color: "#ffc800",
              fontWeight: 600,
              fontSize: 13,
            }}>
              View Services →
            </span>
          </Link>
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
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Image Display */}
                {item.isRealImage ? (
                  <div 
                    onClick={() => setLightboxImage({
                      src: item.image,
                      alt: item.name,
                      hasBack: !!item.imageBack,
                      backSrc: item.imageBack,
                    })}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 180,
                      marginBottom: 12,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "rgba(30, 30, 50, 0.5)",
                      cursor: "zoom-in",
                    }}
                  >
                    <Image
                      src={hoveredItem === item.id && item.imageBack ? item.imageBack : item.image}
                      alt={`${item.name} ${hoveredItem === item.id && item.imageBack ? "(back)" : "(front)"}`}
                      fill
                      style={{ 
                        objectFit: "contain",
                        transition: "opacity 0.3s ease",
                      }}
                    />
                    <div style={{
                      position: "absolute",
                      bottom: 8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "#94a3b8",
                      fontSize: 10,
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}>
                      {hoveredItem === item.id && item.imageBack ? "Back" : "Click to enlarge"}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    fontSize: 64,
                    textAlign: "center",
                    marginBottom: 12,
                    filter: "drop-shadow(0 0 10px rgba(0, 245, 255, 0.3))",
                  }}>
                    {item.image}
                  </div>
                )}
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
                  {item.isRealImage ? (
                    <button
                      style={{
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                      onClick={() => addToCart(item)}
                    >
                      Add to Cart
                    </button>
                  ) : (
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
                  )}
                </div>
                {/* Size Selector for apparel with real images */}
                {item.isRealImage && item.sizes && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ color: "#94a3b8", fontSize: 11, display: "block", marginBottom: 6 }}>
                      Select Size:
                    </label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {item.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes(prev => ({ ...prev, [item.id]: size }))}
                          style={{
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            background: selectedSizes[item.id] === size 
                              ? "rgba(0, 245, 255, 0.2)" 
                              : "rgba(50, 50, 70, 0.3)",
                            color: selectedSizes[item.id] === size ? "#00f5ff" : "#94a3b8",
                            border: `1px solid ${selectedSizes[item.id] === size ? "rgba(0, 245, 255, 0.4)" : "rgba(100, 100, 120, 0.3)"}`,
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

        {/* Layaway Info Section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 59, 212, 0.1), rgba(0, 245, 255, 0.1))",
          border: "1px solid rgba(255, 59, 212, 0.25)",
          borderRadius: 16,
          padding: "32px",
          marginTop: 20,
          marginBottom: 40,
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 20,
            background: "linear-gradient(90deg, #ff3bd4, #00f5ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            💰 How Layaway Works
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 24,
            marginBottom: 24,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
              <h3 style={{ color: "#00f5ff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>1. Add to Cart</h3>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Shop like normal and add items to your cart.
              </p>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <h3 style={{ color: "#00f5ff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>2. Choose Layaway</h3>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                At checkout, select Weekly, Bi-Weekly, or Monthly payments.
              </p>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <h3 style={{ color: "#00f5ff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>3. Make Payments</h3>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Pay on your schedule from your profile. <span style={{ color: "#22c55e", fontWeight: 600 }}>0% Interest!</span>
              </p>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <h3 style={{ color: "#00f5ff", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>4. We Ship!</h3>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Once paid off, your order ships! No credit check required.
              </p>
            </div>
          </div>
          
          <div style={{
            textAlign: "center",
            paddingTop: 16,
            borderTop: "1px solid rgba(100, 100, 120, 0.2)",
          }}>
            <p style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 12 }}>
              Already have a layaway plan? Manage your payments from your profile.
            </p>
            <Link
              href="/profile"
              style={{
                display: "inline-block",
                padding: "12px 32px",
                fontSize: 14,
                fontWeight: 700,
                background: "linear-gradient(135deg, rgba(255, 59, 212, 0.2), rgba(0, 245, 255, 0.2))",
                color: "#00f5ff",
                border: "1px solid rgba(0, 245, 255, 0.4)",
                borderRadius: 8,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              Go to Profile →
            </Link>
          </div>
        </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const SHIPPING_COST = 5.99;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(30, 30, 50, 0.5)",
  border: "1px solid rgba(100, 100, 120, 0.3)",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
};

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
    id: "tee-classic",
    name: "HB Racing 7 Classic Tee",
    description: "Premium cotton tee with HB Racing 7 logo. Dark Miami Neon style.",
    price: 29.99,
    image: "👕",
    category: "apparel",
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; hasBack?: boolean; backSrc?: string } | null>(null);
  const [showingBack, setShowingBack] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{
    orderNumber: string;
    total: number;
    paypalUrl: string;
  } | null>(null);

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
  const orderTotal = cartTotal + SHIPPING_COST;

  const handleCheckoutSubmit = async () => {
    // Validate form
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address || 
        !checkoutForm.city || !checkoutForm.state || !checkoutForm.zip) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.email)) {
      alert("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
          },
          shipping: {
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zip: checkoutForm.zip,
          },
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
          notes: checkoutForm.notes,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setOrderComplete({
          orderNumber: data.order.orderNumber,
          total: data.order.total,
          paypalUrl: data.paypalUrl,
        });
        setCart([]);
        setCartOpen(false);
      } else {
        alert(data.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutOpen(false);
    setOrderComplete(null);
    setCheckoutForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    });
  };

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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, paddingTop: 8, borderTop: "1px solid rgba(100, 100, 120, 0.2)" }}>
              <span style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}>Total:</span>
              <span style={{ color: "#22c55e", fontSize: 20, fontWeight: 700 }}>
                ${orderTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #00f5ff, #ff3bd4)",
                color: "#0a0a1e",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          onClick={() => !orderComplete && resetCheckout()}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            zIndex: 1002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(10, 10, 30, 0.98)",
              border: "1px solid rgba(0, 245, 255, 0.3)",
              borderRadius: 16,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {orderComplete ? (
              /* Order Confirmation */
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "#22c55e", fontSize: 24, fontWeight: 700, margin: "0 0 8px 0" }}>
                  Order Placed!
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px 0" }}>
                  Order #{orderComplete.orderNumber}
                </p>
                
                <div style={{
                  background: "rgba(30, 30, 50, 0.5)",
                  borderRadius: 8,
                  padding: 20,
                  marginBottom: 24,
                }}>
                  <p style={{ color: "#e2e8f0", fontSize: 16, margin: "0 0 8px 0" }}>
                    Total: <strong style={{ color: "#22c55e" }}>${orderComplete.total.toFixed(2)}</strong>
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                    Please complete payment via PayPal to process your order.
                  </p>
                </div>
                
                <a
                  href={orderComplete.paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    width: "100%",
                    padding: "14px 24px",
                    background: "#0070ba",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  Pay with PayPal - ${orderComplete.total.toFixed(2)}
                </a>
                
                <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 20px 0" }}>
                  Include order #{orderComplete.orderNumber} in PayPal notes
                </p>
                
                <button
                  onClick={resetCheckout}
                  style={{
                    padding: "10px 24px",
                    background: "rgba(100, 100, 120, 0.3)",
                    color: "#94a3b8",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              /* Checkout Form */
              <>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
                  <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>
                    Checkout
                  </h2>
                </div>
                
                <div style={{ padding: 24 }}>
                  {/* Order Summary */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                      Order Summary
                    </h3>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          {item.name} {item.size && `(${item.size})`} x{item.quantity}
                        </span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(100, 100, 120, 0.2)", marginTop: 12, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Subtotal</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Shipping</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${SHIPPING_COST.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 14 }}>Total</span>
                        <span style={{ color: "#22c55e", fontSize: 16 }}>${orderTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                    Contact Information
                  </h3>
                  <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  
                  {/* Shipping Address */}
                  <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                    Shipping Address
                  </h3>
                  <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                      style={inputStyle}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        type="text"
                        placeholder="City *"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="State *"
                        value={checkoutForm.state}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, state: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={checkoutForm.zip}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, zip: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  
                  {/* Notes */}
                  <textarea
                    placeholder="Order notes (optional)"
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                
                <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(100, 100, 120, 0.3)", display: "flex", gap: 12 }}>
                  <button
                    onClick={resetCheckout}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      background: "rgba(100, 100, 120, 0.3)",
                      color: "#94a3b8",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckoutSubmit}
                    disabled={isSubmitting}
                    style={{
                      flex: 2,
                      padding: "12px 20px",
                      background: isSubmitting ? "rgba(100, 100, 120, 0.3)" : "linear-gradient(135deg, #00f5ff, #ff3bd4)",
                      color: isSubmitting ? "#94a3b8" : "#0a0a1e",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSubmitting ? "Processing..." : `Place Order - $${orderTotal.toFixed(2)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
        <Link
          href="/shop/parts"
          style={{
            display: "block",
            marginBottom: 32,
            padding: "24px 32px",
            background: "linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 255, 255, 0.1))",
            borderRadius: 12,
            border: "1px solid rgba(0, 255, 0, 0.3)",
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f0", margin: "0 0 8px 0" }}>
            Performance Parts Store
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            Shop camshafts, lifters, and more. In-stock & dropship available.
          </p>
          <span style={{
            display: "inline-block",
            marginTop: 12,
            padding: "8px 20px",
            background: "rgba(0, 255, 0, 0.2)",
            borderRadius: 6,
            color: "#0f0",
            fontWeight: 600,
            fontSize: 14,
          }}>
            Browse Parts →
          </span>
        </Link>

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
    </main>
  );
}

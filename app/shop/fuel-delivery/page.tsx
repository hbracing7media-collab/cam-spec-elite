"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { calculateSalesTax, formatTaxRate, getAllStates } from "@/lib/salesTax";

interface FuelProduct {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  description: string;
  category: "injectors" | "fuel-pumps" | "fuel-rails" | "regulators" | "filters" | "fittings" | "lines" | "accessories";
  subcategory?: string;
  flowRate?: number; // lb/hr for injectors, L/hr for pumps
  fuelType?: string; // gasoline, E85, methanol, etc.
  pressure?: string; // operating pressure
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  image: string;
  isRealImage?: boolean; // Flag for actual images vs emoji placeholders
  shippingCost?: number; // Custom shipping cost for this product (overrides default)
  specs?: Record<string, string>;
}

interface CartItem {
  id: string;
  name: string;
  brand: string;
  partNumber: string;
  price: number;
  quantity: number;
  image: string;
  shippingCost?: number; // Custom shipping for this item
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

const SHIPPING_COST = 14.99;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(30, 30, 50, 0.8)",
  border: "1px solid rgba(255, 100, 50, 0.3)",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
};

// Fuel delivery products - only verified items with real pricing
const fuelProducts: FuelProduct[] = [
  // Injectors
  {
    id: "inj-bosch-1462-6",
    name: "Bosch 1462cc Flow Matched Injectors (Set of 6)",
    brand: "Bosch Motorsport",
    partNumber: "130-06-150",
    description: "Flow matched Bosch 1462cc/1500cc high-impedance injectors, adapted to 65mm EV14L for 6-cyl fuel rails. Includes filtered top adapters.",
    category: "injectors",
    flowRate: 132,
    fuelType: "Gasoline, E85, Methanol*",
    price: 1021.80,
    shippingCost: 34.00,
    inStock: true,
    image: "/shop/-ev14L.jpg",
    isRealImage: true,
    specs: {
      "Flow Rate": "1462cc/min (132 lb/hr) @ 3 BAR",
      "Impedance": "High (8.5 ohm)",
      "Connector": "Bosch JPT EV1 Minitimer",
      "Type": "65mm EV14L (Long)",
      "O-Rings": "14mm Viton / 14mm Viton",
      "Bosch P/N": "0280158333",
      "Shipping": "FedEx Intl Connect+",
    },
  },
];

const categoryLabels: Record<string, string> = {
  injectors: "Fuel Injectors",
  "fuel-pumps": "Fuel Pumps",
  "fuel-rails": "Fuel Rails",
  regulators: "Pressure Regulators",
  filters: "Fuel Filters",
  fittings: "AN Fittings",
  lines: "Fuel Lines",
  accessories: "Accessories",
};

const categoryIcons: Record<string, string> = {
  injectors: "💉",
  "fuel-pumps": "⛽",
  "fuel-rails": "🔧",
  regulators: "🎛️",
  filters: "🔬",
  fittings: "🔩",
  lines: "〰️",
  accessories: "🛠️",
};

export default function FuelDeliveryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
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

  // Get unique brands
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(fuelProducts.map((p) => p.brand))];
    return brands.sort();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return fuelProducts.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (selectedBrand !== "all" && product.brand !== selectedBrand) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.partNumber.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  // Cart functions
  const addToCart = (product: FuelProduct) => {
    if (!product.inStock) {
      alert("This item is currently out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          partNumber: product.partNumber,
          price: product.price,
          quantity: 1,
          image: product.image,
          shippingCost: product.shippingCost,
        },
      ];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate shipping - use max of custom shipping costs or default
  const shippingTotal = useMemo(() => {
    const customShipping = cart.reduce((max, item) => {
      if (item.shippingCost && item.shippingCost > max) return item.shippingCost;
      return max;
    }, 0);
    return customShipping > 0 ? customShipping : SHIPPING_COST;
  }, [cart]);

  // Tax calculation
  const taxInfo = useMemo(() => {
    if (!checkoutForm.state) {
      return { taxAmount: 0, taxRate: 0, stateAbbr: null };
    }
    return calculateSalesTax(cartTotal, checkoutForm.state, false, shippingTotal);
  }, [cartTotal, checkoutForm.state, shippingTotal]);

  const orderTotal = cartTotal + shippingTotal + taxInfo.taxAmount;

  const usStates = useMemo(() => getAllStates(), []);

  const handleCheckoutSubmit = async () => {
    if (
      !checkoutForm.name ||
      !checkoutForm.email ||
      !checkoutForm.address ||
      !checkoutForm.city ||
      !checkoutForm.state ||
      !checkoutForm.zip
    ) {
      alert("Please fill in all required fields");
      return;
    }

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
          items: cart.map((item) => ({
            id: item.id,
            name: `${item.brand} ${item.name}`,
            partNumber: item.partNumber,
            quantity: item.quantity,
            price: item.price,
          })),
          tax: {
            amount: taxInfo.taxAmount,
            rate: taxInfo.taxRate,
            state: taxInfo.stateAbbr,
          },
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
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)" }}>
      {/* Cart Overlay */}
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

      {/* Cart Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: cartOpen ? 0 : -420,
          width: 400,
          height: "100vh",
          background: "rgba(10, 10, 30, 0.98)",
          borderLeft: "1px solid rgba(255, 100, 50, 0.3)",
          zIndex: 1001,
          transition: "right 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 20, borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>
              🛒 Cart ({cartCount})
            </h2>
            <button
              onClick={() => setCartOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {cart.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  background: "rgba(30, 30, 50, 0.5)",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ width: 60, height: 60, background: "rgba(255,100,50,0.1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  ⛽
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, margin: "0 0 2px 0" }}>
                    {item.brand}
                  </h4>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 4px 0" }}>{item.name}</p>
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
                    <span style={{ color: "#ff6432", fontSize: 14, fontWeight: 600, marginLeft: "auto" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer", padding: 0 }}
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
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Shipping:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>${shippingTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>Tax:</span>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>
                {taxInfo.stateAbbr ? `$${taxInfo.taxAmount.toFixed(2)}` : "Calculated at checkout"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingTop: 8,
                borderTop: "1px solid rgba(100, 100, 120, 0.2)",
              }}
            >
              <span style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}>Total:</span>
              <span style={{ color: "#ff6432", fontSize: 20, fontWeight: 700 }}>
                ${orderTotal.toFixed(2)}
                {!taxInfo.stateAbbr && "+tax"}
              </span>
            </div>
            <button
              onClick={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #ff6432, #ff3d00)",
                color: "white",
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
              border: "1px solid rgba(255, 100, 50, 0.3)",
              borderRadius: 16,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {orderComplete ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "#22c55e", fontSize: 24, fontWeight: 700, margin: "0 0 8px 0" }}>
                  Order Placed!
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px 0" }}>
                  Order #{orderComplete.orderNumber}
                </p>

                <div style={{ background: "rgba(30, 30, 50, 0.5)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
                  <p style={{ color: "#e2e8f0", fontSize: 16, margin: "0 0 8px 0" }}>
                    Total: <strong style={{ color: "#ff6432" }}>${orderComplete.total.toFixed(2)}</strong>
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
              <>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(100, 100, 120, 0.3)" }}>
                  <h2 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700, margin: 0 }}>Checkout</h2>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Order Summary */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" }}>
                      Order Summary
                    </h3>
                    {cart.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          {item.brand} {item.name} x{item.quantity}
                        </span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(100, 100, 120, 0.2)", marginTop: 12, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Subtotal</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>Shipping</span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>${shippingTotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 13 }}>
                          Tax {taxInfo.stateAbbr && `(${taxInfo.stateAbbr} ${formatTaxRate(taxInfo.taxRate)})`}
                        </span>
                        <span style={{ color: "#e2e8f0", fontSize: 13 }}>
                          {taxInfo.stateAbbr ? `$${taxInfo.taxAmount.toFixed(2)}` : "Select state"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span style={{ color: "#e2e8f0", fontSize: 14 }}>Total</span>
                        <span style={{ color: "#ff6432", fontSize: 16 }}>${orderTotal.toFixed(2)}</span>
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
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
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
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                      style={inputStyle}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        type="text"
                        placeholder="City *"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm((prev) => ({ ...prev, city: e.target.value }))}
                        style={inputStyle}
                      />
                      <select
                        value={checkoutForm.state}
                        onChange={(e) => setCheckoutForm((prev) => ({ ...prev, state: e.target.value }))}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value="">Select State *</option>
                        {usStates.map((st) => (
                          <option key={st.abbr} value={st.abbr}>
                            {st.abbr} - {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={checkoutForm.zip}
                      onChange={(e) => setCheckoutForm((prev) => ({ ...prev, zip: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Order notes (optional)"
                    value={checkoutForm.notes}
                    onChange={(e) => setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))}
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
                      background: isSubmitting ? "rgba(100, 100, 120, 0.3)" : "linear-gradient(135deg, #ff6432, #ff3d00)",
                      color: isSubmitting ? "#94a3b8" : "white",
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

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
          <div>
            <Link href="/shop" style={{ color: "#ff6432", textDecoration: "none", fontSize: 14 }}>
              ← Back to Shop
            </Link>
            <h1
              style={{
                fontSize: "2.5rem",
                marginTop: 10,
                marginBottom: 8,
                background: "linear-gradient(90deg, #ff6432, #ff3d00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ⛽ Fuel Delivery Systems
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 16, margin: 0 }}>
              High-performance fuel injectors, pumps, rails & accessories for serious power
            </p>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            style={{
              background: "linear-gradient(135deg, #ff6432, #ff3d00)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            style={{
              padding: "10px 18px",
              background: selectedCategory === "all" ? "linear-gradient(135deg, #ff6432, #ff3d00)" : "rgba(30, 30, 50, 0.8)",
              border: selectedCategory === "all" ? "none" : "1px solid rgba(255, 100, 50, 0.3)",
              borderRadius: 20,
              color: selectedCategory === "all" ? "white" : "#e2e8f0",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            All Products
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: "10px 18px",
                background: selectedCategory === key ? "linear-gradient(135deg, #ff6432, #ff3d00)" : "rgba(30, 30, 50, 0.8)",
                border: selectedCategory === key ? "none" : "1px solid rgba(255, 100, 50, 0.3)",
                borderRadius: 20,
                color: selectedCategory === key ? "white" : "#e2e8f0",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {categoryIcons[key]} {label}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            background: "rgba(0,0,0,0.3)",
            padding: 16,
            borderRadius: 10,
          }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(255,100,50,0.2)",
              borderRadius: 6,
              color: "#fff",
              minWidth: 250,
            }}
          />
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(255,100,50,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <div style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 14, alignSelf: "center" }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
            <p>No products match your filters</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "rgba(20, 20, 40, 0.8)",
                  border: "1px solid rgba(255, 100, 50, 0.2)",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Product Image */}
                <div
                  style={{
                    height: 180,
                    background: "linear-gradient(135deg, rgba(255,100,50,0.1), rgba(255,60,0,0.05))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 64,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {product.isRealImage ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: "contain", padding: 10 }}
                    />
                  ) : (
                    categoryIcons[product.category] || "⛽"
                  )}
                  {!product.inStock && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "#ef4444",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      OUT OF STOCK
                    </div>
                  )}
                  {product.compareAtPrice && product.inStock && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "#22c55e",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      SALE
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{ color: "#ff6432", fontSize: 12, fontWeight: 600 }}>{product.brand}</span>
                    <span style={{ color: "#64748b", fontSize: 11 }}>{product.partNumber}</span>
                  </div>
                  <h3 style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, margin: "0 0 8px 0", lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px 0", lineHeight: 1.4 }}>
                    {product.description}
                  </p>

                  {/* Specs Preview */}
                  {product.specs && (
                    <div style={{ marginBottom: 12 }}>
                      {Object.entries(product.specs)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 2,
                            }}
                          >
                            <span>{key}:</span>
                            <span style={{ color: "#94a3b8" }}>{value}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Price & Add to Cart */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <div>
                      <span style={{ color: "#ff6432", fontSize: 20, fontWeight: 700 }}>
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: 14,
                            textDecoration: "line-through",
                            marginLeft: 8,
                          }}
                        >
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      style={{
                        padding: "10px 16px",
                        background: product.inStock
                          ? "linear-gradient(135deg, #ff6432, #ff3d00)"
                          : "rgba(100, 100, 120, 0.3)",
                        color: product.inStock ? "white" : "#64748b",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: product.inStock ? "pointer" : "not-allowed",
                      }}
                    >
                      {product.inStock ? "Add to Cart" : "Sold Out"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div
          style={{
            marginTop: 40,
            padding: 24,
            background: "rgba(20, 20, 40, 0.6)",
            borderRadius: 12,
            border: "1px solid rgba(255, 100, 50, 0.2)",
          }}
        >
          <h3 style={{ color: "#ff6432", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            ⛽ Why Quality Fuel Delivery Matters
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                💉 Injector Sizing
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Properly sized injectors ensure optimal air/fuel ratios across your entire RPM range. Too small = lean at high RPM. Too big = poor idle quality.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                ⚡ E85 Compatibility
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                E85 requires ~30% more fuel flow than gasoline. Ensure your entire fuel system (pumps, lines, injectors) is rated for ethanol.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                📊 Flow Matching
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
                Match your fuel pump flow to injector demand. A good rule: pump should flow 10-20% more than total injector demand at max duty cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      <button
        onClick={() => setCartOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6432, #ff3d00)",
          color: "white",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(255, 100, 50, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        🛒
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "white",
              width: 22,
              height: 22,
              borderRadius: "50%",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cartCount}
          </span>
        )}
      </button>
    </main>
  );
}

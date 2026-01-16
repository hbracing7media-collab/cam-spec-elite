"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  brand: string;
  part_number: string;
  description: string;
  category: string;
  engine_make: string;
  engine_family: string;
  duration_int_050: number;
  duration_exh_050: number;
  lift_int: number;
  lift_exh: number;
  lsa: number;
  cam_type: string;
  price: number;
  compare_at_price: number | null;
  fulfillment_type: string;
  quantity_in_stock: number;
  image_url: string;
  is_featured: boolean;
  slug: string;
}

interface CartItem {
  id: string;
  name: string;
  brand: string;
  part_number: string;
  price: number;
  quantity: number;
  image_url: string;
  fulfillment_type: string;
}

const SHIPPING_COST = 12.99;

export default function CamshaftsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [filters, setFilters] = useState({
    brand: "",
    engine_make: "",
    cam_type: "",
    search: "",
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    fetchProducts();
    const savedCart = localStorage.getItem("hbr-cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes (only if not empty or explicitly cleared)
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("hbr-cart", JSON.stringify(cart));
    }
  }, [cart]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/parts/products?category=camshaft");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          part_number: product.part_number,
          price: product.price,
          quantity: 1,
          image_url: product.image_url,
          fulfillment_type: product.fulfillment_type,
        },
      ];
    });
    setShowCart(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.engine_make && p.engine_make !== filters.engine_make) return false;
    if (filters.cam_type && p.cam_type !== filters.cam_type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.part_number.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const uniqueBrands = [...new Set(products.map((p) => p.brand))].sort();
  const uniqueMakes = [...new Set(products.map((p) => p.engine_make).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(products.map((p) => p.cam_type).filter(Boolean))].sort();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <Link href="/shop" style={{ color: "#0ff", textDecoration: "none", fontSize: 14 }}>
              ← Back to Shop
            </Link>
            <h1
              style={{
                fontSize: "2rem",
                marginTop: 10,
                background: "linear-gradient(90deg, #0ff, #f0f)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🎯 Performance Camshafts
            </h1>
            <p style={{ opacity: 0.7, marginTop: 5 }}>
              Shop cams from top brands. In-stock & dropship available.
            </p>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              background: "linear-gradient(90deg, #0ff, #0aa)",
              color: "#000",
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

        {/* Filters */}
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
            placeholder="Search cams..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,255,255,0.2)",
              borderRadius: 6,
              color: "#fff",
              minWidth: 200,
            }}
          />
          <select
            value={filters.brand}
            onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,255,255,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="">All Brands</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filters.engine_make}
            onChange={(e) => setFilters((f) => ({ ...f, engine_make: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,255,255,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="">All Makes</option>
            {uniqueMakes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={filters.cam_type}
            onChange={(e) => setFilters((f) => ({ ...f, cam_type: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(0,255,255,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, opacity: 0.7 }}>Loading camshafts...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 18, opacity: 0.7 }}>No camshafts found</p>
            <p style={{ fontSize: 14, opacity: 0.5, marginTop: 10 }}>
              Check back soon or contact us for special orders
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: 12,
                  border: "1px solid rgba(0,255,255,0.2)",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Image */}
                <div
                  style={{
                    height: 180,
                    background: "rgba(20,20,40,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      style={{ objectFit: "contain", padding: 10 }}
                    />
                  ) : (
                    <span style={{ fontSize: 48, opacity: 0.3 }}>🎯</span>
                  )}
                  {/* Badges */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                    {product.is_featured && (
                      <span
                        style={{
                          background: "#f0f",
                          color: "#000",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        FEATURED
                      </span>
                    )}
                    <span
                      style={{
                        background: product.fulfillment_type === "in_stock" ? "#0f0" : "#ff0",
                        color: "#000",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {product.fulfillment_type === "in_stock"
                        ? `IN STOCK (${product.quantity_in_stock})`
                        : "SHIPS FROM MFR"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#0ff", marginBottom: 4 }}>
                    {product.brand} • {product.part_number}
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{product.name}</h3>

                  {/* Cam Specs */}
                  {product.duration_int_050 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        fontSize: 12,
                        opacity: 0.8,
                        marginBottom: 12,
                        background: "rgba(0,255,255,0.05)",
                        padding: 10,
                        borderRadius: 6,
                      }}
                    >
                      <div>Duration: {product.duration_int_050}/{product.duration_exh_050}°</div>
                      <div>Lift: {product.lift_int}/{product.lift_exh}&quot;</div>
                      <div>LSA: {product.lsa}°</div>
                      <div>{product.cam_type}</div>
                    </div>
                  )}

                  {/* Engine */}
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
                    {product.engine_make} {product.engine_family}
                  </div>

                  {/* Price & Add to Cart */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 700, color: "#0ff" }}>
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compare_at_price && (
                        <span
                          style={{
                            marginLeft: 8,
                            textDecoration: "line-through",
                            opacity: 0.5,
                            fontSize: 14,
                          }}
                        >
                          ${product.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        background: "linear-gradient(90deg, #0ff, #0aa)",
                        color: "#000",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: 6,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Sidebar */}
        {showCart && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              maxWidth: "100vw",
              background: "rgba(10,10,30,0.98)",
              borderLeft: "1px solid rgba(0,255,255,0.3)",
              padding: 24,
              zIndex: 1000,
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ opacity: 0.6 }}>Your cart is empty</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#0ff" }}>{item.brand}</div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{item.part_number}</div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            borderRadius: 4,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "rgba(255,255,255,0.1)",
                            border: "none",
                            borderRadius: 4,
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#0ff" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 16, paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, opacity: 0.7 }}>
                    <span>Shipping</span>
                    <span>${SHIPPING_COST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
                    <span>Total</span>
                    <span style={{ color: "#0ff" }}>${(cartTotal + SHIPPING_COST).toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/shop/checkout"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 20,
                    padding: "14px 24px",
                    background: "linear-gradient(90deg, #0f0, #0a0)",
                    color: "#000",
                    borderRadius: 8,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Proceed to Checkout
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

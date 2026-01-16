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

const SHIPPING_COST = 75.00; // Higher shipping for heads

export default function CylinderHeadsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [filters, setFilters] = useState({
    brand: "",
    engine_make: "",
    engine_family: "",
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
      const res = await fetch("/api/parts/products?category=cylinder_head");
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
    if (filters.engine_family && p.engine_family !== filters.engine_family) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.part_number.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const uniqueBrands = [...new Set(products.map((p) => p.brand))].sort();
  const uniqueMakes = [...new Set(products.map((p) => p.engine_make).filter(Boolean))].sort();
  const uniqueFamilies = [...new Set(products.map((p) => p.engine_family).filter(Boolean))].sort();

  // Determine if a product is Cast or CNC
  const getHeadType = (product: Product): 'Cast' | 'CNC' => {
    const name = product.name.toLowerCase();
    const desc = (product.description || '').toLowerCase();
    if (name.includes('cnc') || desc.includes('cnc')) return 'CNC';
    if (name.includes('enforcer') || name.includes('as cast') || desc.includes('as cast')) return 'Cast';
    return 'Cast'; // Default to Cast if unclear
  };

  // Extract intake runner CC from product name (e.g., "AFR 185cc SBF..." -> 185)
  const getIntakeCC = (product: Product): number => {
    const match = product.name.match(/(\d+)cc/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  // Check if product is Assembled (vs Bare)
  const isAssembled = (product: Product): boolean => {
    return product.name.toLowerCase().includes('assembled');
  };

  // Sort products by price (low to high), then intake CC (low to high), then Assembled before Bare
  const sortByPriceThenIntakeCC = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      // First: sort by price (lowest first)
      const priceDiff = a.price - b.price;
      if (priceDiff !== 0) return priceDiff;
      // Second: sort by intake CC (lowest first)
      const ccDiff = getIntakeCC(a) - getIntakeCC(b);
      if (ccDiff !== 0) return ccDiff;
      // Third: Assembled before Bare
      if (isAssembled(a) && !isAssembled(b)) return -1;
      if (!isAssembled(a) && isAssembled(b)) return 1;
      return 0;
    });
  };

  // Group products by engine family with Cast and CNC sub-groups
  const groupedByFamily = filteredProducts.reduce((acc, product) => {
    const make = product.engine_make || 'Other';
    const family = product.engine_family || 'Other';
    const headType = getHeadType(product);
    const key = `${make}|||${family}`;
    if (!acc[key]) {
      acc[key] = { make, family, cast: [], cnc: [] };
    }
    if (headType === 'Cast') {
      acc[key].cast.push(product);
    } else {
      acc[key].cnc.push(product);
    }
    return acc;
  }, {} as Record<string, { make: string; family: string; cast: Product[]; cnc: Product[] }>);

  // Sort products within each group by price then intake CC
  Object.values(groupedByFamily).forEach(group => {
    group.cast = sortByPriceThenIntakeCC(group.cast);
    group.cnc = sortByPriceThenIntakeCC(group.cnc);
  });

  // Sort groups by make then family
  const makeOrder = ['Chevy', 'Ford', 'Mopar', 'Other'];
  const familyOrder: Record<string, string[]> = {
    'Chevy': ['SBC', 'LS', 'LS3', 'BBC'],
    'Ford': ['SBF', 'BBF', 'Modular', 'Coyote'],
    'Mopar': ['Small Block', 'Big Block', 'Hemi'],
  };

  const sortedGroups = Object.values(groupedByFamily).sort((a, b) => {
    const makeIndexA = makeOrder.indexOf(a.make);
    const makeIndexB = makeOrder.indexOf(b.make);
    const makeCompare = (makeIndexA === -1 ? 999 : makeIndexA) - (makeIndexB === -1 ? 999 : makeIndexB);
    if (makeCompare !== 0) return makeCompare;
    
    const familiesForMake = familyOrder[a.make] || [];
    const familyIndexA = familiesForMake.indexOf(a.family);
    const familyIndexB = familiesForMake.indexOf(b.family);
    return (familyIndexA === -1 ? 999 : familyIndexA) - (familyIndexB === -1 ? 999 : familyIndexB);
  });

  // Product Card Component
  const ProductCard = ({ product, addToCart }: { product: Product; addToCart: (p: Product) => void }) => (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        border: "1px solid rgba(255,0,255,0.2)",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 200,
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
          <span style={{ fontSize: 48, opacity: 0.3 }}>🔩</span>
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
        <div style={{ fontSize: 12, color: "#f0f", marginBottom: 4 }}>
          {product.brand} • {product.part_number}
        </div>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>{product.name}</h3>

        {/* Description */}
        {product.description && (
          <div
            style={{
              fontSize: 12,
              opacity: 0.8,
              marginBottom: 12,
              background: "rgba(255,0,255,0.05)",
              padding: 10,
              borderRadius: 6,
              lineHeight: 1.4,
            }}
          >
            {product.description.length > 120
              ? product.description.substring(0, 120) + "..."
              : product.description}
          </div>
        )}

        {/* Engine */}
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
          {product.engine_make} {product.engine_family}
        </div>

        {/* Price & Add to Cart */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#f0f" }}>
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
              background: "linear-gradient(90deg, #f0f, #a0a)",
              color: "#fff",
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
  );

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
                background: "linear-gradient(90deg, #f0f, #0ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🔩 Cylinder Heads
            </h1>
            <p style={{ opacity: 0.7, marginTop: 5 }}>
              AFR, Trick Flow & more. Aluminum performance heads for your build.
            </p>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              background: "linear-gradient(90deg, #f0f, #a0a)",
              color: "#fff",
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
            placeholder="Search heads..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(255,0,255,0.2)",
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
              border: "1px solid rgba(255,0,255,0.2)",
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
              border: "1px solid rgba(255,0,255,0.2)",
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
            value={filters.engine_family}
            onChange={(e) => setFilters((f) => ({ ...f, engine_family: e.target.value }))}
            style={{
              padding: "10px 14px",
              background: "rgba(30,30,50,0.8)",
              border: "1px solid rgba(255,0,255,0.2)",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <option value="">All Families</option>
            {uniqueFamilies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, opacity: 0.7 }}>Loading cylinder heads...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 18, opacity: 0.7 }}>No cylinder heads found</p>
            <p style={{ fontSize: 14, opacity: 0.5, marginTop: 10 }}>
              Check back soon or contact us for special orders
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 50 }}>
            {sortedGroups.map((group) => (
              <div key={`${group.make}-${group.family}`}>
                {/* Engine Family Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: "3px solid rgba(255,0,255,0.4)",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f0f 0%, #a0a 100%)",
                      padding: "10px 20px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {group.make}
                  </div>
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      background: "linear-gradient(90deg, #fff, #0ff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      margin: 0,
                    }}
                  >
                    {group.family}
                  </h2>
                  <span style={{ opacity: 0.5, fontSize: 14 }}>
                    ({group.cast.length + group.cnc.length} heads)
                  </span>
                </div>

                {/* Cast Section */}
                {group.cast.length > 0 && (
                  <div style={{ marginBottom: 30 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg, #ff0 0%, #a80 100%)",
                          color: "#000",
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        🏭 As Cast
                      </div>
                      <span style={{ opacity: 0.5, fontSize: 13 }}>
                        ({group.cast.length} {group.cast.length === 1 ? 'head' : 'heads'})
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {group.cast.map((product) => (
                        <ProductCard key={product.id} product={product} addToCart={addToCart} />
                      ))}
                    </div>
                  </div>
                )}

                {/* CNC Section */}
                {group.cnc.length > 0 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg, #0ff 0%, #0aa 100%)",
                          color: "#000",
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        🔧 CNC Ported
                      </div>
                      <span style={{ opacity: 0.5, fontSize: 13 }}>
                        ({group.cnc.length} {group.cnc.length === 1 ? 'head' : 'heads'})
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {group.cnc.map((product) => (
                        <ProductCard key={product.id} product={product} addToCart={addToCart} />
                      ))}
                    </div>
                  </div>
                )}
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
              borderLeft: "1px solid rgba(255,0,255,0.3)",
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
                      <div style={{ fontSize: 12, color: "#f0f" }}>{item.brand}</div>
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
                      <div style={{ fontWeight: 700, color: "#f0f" }}>
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
                    <span>Shipping (Freight)</span>
                    <span>${SHIPPING_COST.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
                    <span>Total</span>
                    <span style={{ color: "#f0f" }}>${(cartTotal + SHIPPING_COST).toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/shop/checkout"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 20,
                    padding: "14px 24px",
                    background: "linear-gradient(90deg, #f0f, #a0a)",
                    color: "#fff",
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  brand: string;
  part_number: string;
  description: string;
  category: string;
  engine_make: string;
  engine_family: string;
  duration_int_050: number | null;
  duration_exh_050: number | null;
  lift_int: number | null;
  lift_exh: number | null;
  lsa: number | null;
  cam_type: string;
  price: number;
  compare_at_price: number | null;
  cost: number | null;
  fulfillment_type: string;
  quantity_in_stock: number;
  supplier_name: string;
  supplier_sku: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
}

const emptyProduct: Omit<Product, "id"> = {
  name: "",
  brand: "",
  part_number: "",
  description: "",
  category: "camshaft",
  engine_make: "",
  engine_family: "",
  duration_int_050: null,
  duration_exh_050: null,
  lift_int: null,
  lift_exh: null,
  lsa: null,
  cam_type: "",
  price: 0,
  compare_at_price: null,
  cost: null,
  fulfillment_type: "in_stock",
  quantity_in_stock: 0,
  supplier_name: "",
  supplier_sku: "",
  image_url: "",
  is_active: true,
  is_featured: false,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "rgba(30,30,50,0.8)",
  border: "1px solid rgba(0,255,255,0.2)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  color: "#0ff",
};

export default function AdminPartsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id">>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/parts/products");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editing
        ? `/api/admin/parts/products/${editing.id}`
        : "/api/admin/parts/products";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage({ type: "err", text: result.message || "Failed to save" });
      } else {
        setMessage({ type: "ok", text: editing ? "Product updated!" : "Product created!" });
        setEditing(null);
        setFormData(emptyProduct);
        fetchProducts();
      }
    } catch (err) {
      setMessage({ type: "err", text: "Failed to save product" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    try {
      const res = await fetch(`/api/admin/parts/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const startEdit = (product: Product) => {
    setEditing(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      part_number: product.part_number,
      description: product.description || "",
      category: product.category,
      engine_make: product.engine_make || "",
      engine_family: product.engine_family || "",
      duration_int_050: product.duration_int_050,
      duration_exh_050: product.duration_exh_050,
      lift_int: product.lift_int,
      lift_exh: product.lift_exh,
      lsa: product.lsa,
      cam_type: product.cam_type || "",
      price: product.price,
      compare_at_price: product.compare_at_price,
      cost: product.cost,
      fulfillment_type: product.fulfillment_type,
      quantity_in_stock: product.quantity_in_stock,
      supplier_name: product.supplier_name || "",
      supplier_sku: product.supplier_sku || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData(emptyProduct);
    setMessage(null);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a1a", padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <Link href="/admin" style={{ color: "#0ff", textDecoration: "none", fontSize: 14 }}>
              ← Back to Admin
            </Link>
            <h1 style={{ fontSize: "1.8rem", marginTop: 10 }}>Parts Store - Products</h1>
          </div>
          <Link
            href="/shop/parts"
            target="_blank"
            style={{
              background: "rgba(0,255,255,0.1)",
              color: "#0ff",
              padding: "10px 20px",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            View Store →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 30 }}>
          {/* Products List */}
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 16, color: "#0ff" }}>
              Products ({products.length})
            </h2>
            {loading ? (
              <p style={{ opacity: 0.6 }}>Loading...</p>
            ) : products.length === 0 ? (
              <p style={{ opacity: 0.6 }}>No products yet. Add your first product!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: 8,
                      padding: 16,
                      border: editing?.id === product.id ? "2px solid #0ff" : "1px solid rgba(0,255,255,0.2)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontWeight: 600 }}>{product.name}</span>
                          {!product.is_active && (
                            <span style={{ background: "#f00", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                              INACTIVE
                            </span>
                          )}
                          {product.is_featured && (
                            <span style={{ background: "#f0f", color: "#000", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                          {product.brand} • {product.part_number}
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          <span style={{ color: "#0ff", fontWeight: 600 }}>${product.price.toFixed(2)}</span>
                          {" • "}
                          <span style={{ color: product.fulfillment_type === "in_stock" ? "#0f0" : "#ff0" }}>
                            {product.fulfillment_type === "in_stock"
                              ? `In Stock (${product.quantity_in_stock})`
                              : "Dropship"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => startEdit(product)}
                          style={{
                            background: "rgba(0,255,255,0.2)",
                            border: "none",
                            color: "#0ff",
                            padding: "8px 16px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          style={{
                            background: "rgba(255,0,0,0.2)",
                            border: "none",
                            color: "#f66",
                            padding: "8px 16px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              borderRadius: 12,
              padding: 24,
              border: "1px solid rgba(0,255,255,0.2)",
              height: "fit-content",
              position: "sticky",
              top: 20,
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 20, color: "#0ff" }}>
              {editing ? "Edit Product" : "Add New Product"}
            </h2>

            {message && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                  background: message.type === "ok" ? "rgba(0,255,0,0.1)" : "rgba(255,0,0,0.1)",
                  color: message.type === "ok" ? "#0f0" : "#f66",
                }}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData((f) => ({ ...f, brand: e.target.value }))}
                  style={inputStyle}
                  required
                  placeholder="e.g., COMP Cams"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Part Number *</label>
                <input
                  type="text"
                  value={formData.part_number}
                  onChange={(e) => setFormData((f) => ({ ...f, part_number: e.target.value }))}
                  style={inputStyle}
                  required
                  placeholder="e.g., CL35-518-8"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                  required
                  placeholder="e.g., XFI Xtreme Truck Cam"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 80 }}
                  placeholder="Product description..."
                />
              </div>

              {/* Engine Compatibility */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Engine Make</label>
                  <select
                    value={formData.engine_make}
                    onChange={(e) => setFormData((f) => ({ ...f, engine_make: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select...</option>
                    <option value="Ford">Ford</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Mopar">Mopar</option>
                    <option value="Pontiac">Pontiac</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Engine Family</label>
                  <input
                    type="text"
                    value={formData.engine_family}
                    onChange={(e) => setFormData((f) => ({ ...f, engine_family: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g., Small Block Windsor"
                  />
                </div>
              </div>

              {/* Cam Specs */}
              <div style={{ background: "rgba(0,255,255,0.05)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#0ff", marginBottom: 12 }}>Cam Specs</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Duration Int @.050</label>
                    <input
                      type="number"
                      value={formData.duration_int_050 || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, duration_int_050: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle}
                      placeholder="224"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Duration Exh @.050</label>
                    <input
                      type="number"
                      value={formData.duration_exh_050 || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, duration_exh_050: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle}
                      placeholder="230"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Lift Int</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.lift_int || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, lift_int: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle}
                      placeholder="0.550"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Lift Exh</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.lift_exh || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, lift_exh: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle}
                      placeholder="0.555"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>LSA</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.lsa || ""}
                      onChange={(e) => setFormData((f) => ({ ...f, lsa: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle}
                      placeholder="112"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Cam Type</label>
                    <select
                      value={formData.cam_type}
                      onChange={(e) => setFormData((f) => ({ ...f, cam_type: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Select...</option>
                      <option value="Hydraulic Flat">Hydraulic Flat</option>
                      <option value="Hydraulic Roller">Hydraulic Roller</option>
                      <option value="Solid Flat">Solid Flat</option>
                      <option value="Solid Roller">Solid Roller</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, price: Number(e.target.value) }))}
                    style={inputStyle}
                    required
                    placeholder="299.99"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Compare At</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compare_at_price || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, compare_at_price: e.target.value ? Number(e.target.value) : null }))}
                    style={inputStyle}
                    placeholder="MSRP"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Your Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, cost: e.target.value ? Number(e.target.value) : null }))}
                    style={inputStyle}
                    placeholder="Cost"
                  />
                </div>
              </div>

              {/* Inventory */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Fulfillment Type</label>
                  <select
                    value={formData.fulfillment_type}
                    onChange={(e) => setFormData((f) => ({ ...f, fulfillment_type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="in_stock">In Stock (I ship it)</option>
                    <option value="dropship">Dropship (Supplier ships)</option>
                    <option value="made_to_order">Made to Order</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Qty In Stock</label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData((f) => ({ ...f, quantity_in_stock: Number(e.target.value) }))}
                    style={inputStyle}
                    disabled={formData.fulfillment_type !== "in_stock"}
                  />
                </div>
              </div>

              {/* Dropship Info */}
              {formData.fulfillment_type === "dropship" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Supplier Name</label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData((f) => ({ ...f, supplier_name: e.target.value }))}
                      style={inputStyle}
                      placeholder="e.g., Summit Racing"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Supplier SKU</label>
                    <input
                      type="text"
                      value={formData.supplier_sku}
                      onChange={(e) => setFormData((f) => ({ ...f, supplier_sku: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Image */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData((f) => ({ ...f, image_url: e.target.value }))}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>

              {/* Status */}
              <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active (visible in store)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData((f) => ({ ...f, is_featured: e.target.checked }))}
                  />
                  Featured
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    background: "linear-gradient(90deg, #0ff, #0aa)",
                    color: "#000",
                    border: "none",
                    padding: "12px 0",
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : editing ? "Update Product" : "Add Product"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

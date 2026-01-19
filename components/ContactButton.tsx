"use client";

import { useState } from "react";

export default function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setSent(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Contact Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 9998,
          background: "linear-gradient(135deg, #ff3bd4, #8b5cf6)",
          border: "none",
          borderRadius: 50,
          padding: "14px 24px",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 0 20px rgba(255, 59, 212, 0.5)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 59, 212, 0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 59, 212, 0.5)";
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Contact Us
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(5, 8, 22, 0.95)",
              border: "1px solid rgba(0, 245, 255, 0.4)",
              borderRadius: 16,
              padding: 28,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 0 40px rgba(0, 245, 255, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 22, color: "#00f5ff", letterSpacing: "0.08em" }}>
                Contact HB Racing
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <p style={{ color: "#00f5ff", fontSize: 18 }}>Message sent successfully!</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>We&apos;ll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(0, 245, 255, 0.3)",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                      outline: "none",
                    }}
                    placeholder="John Doe"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(0, 245, 255, 0.3)",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                      outline: "none",
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
                    Subject
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(0, 245, 255, 0.3)",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                      outline: "none",
                    }}
                  >
                    <option value="">Select a topic...</option>
                    <option value="General Question">General Question</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Order Inquiry">Order Inquiry</option>
                    <option value="Cam Submission Help">Cam Submission Help</option>
                    <option value="Partnership/Sponsorship">Partnership/Sponsorship</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "1px solid rgba(0, 245, 255, 0.3)",
                      borderRadius: 8,
                      color: "#e5e7eb",
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                    }}
                    placeholder="How can we help you?"
                  />
                </div>

                {error && (
                  <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    background: sending
                      ? "rgba(0, 245, 255, 0.3)"
                      : "linear-gradient(135deg, #00f5ff, #8b5cf6)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: sending ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>

                <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#64748b" }}>
                  Or email us directly at{" "}
                  <a href="mailto:hbracing77@yahoo.com" style={{ color: "#00f5ff" }}>
                    hbracing77@yahoo.com
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

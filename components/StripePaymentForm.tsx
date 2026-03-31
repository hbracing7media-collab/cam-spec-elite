"use client";

import { useState } from "react";

// ============================================
// TYPES
// ============================================
interface StripePaymentFormProps {
  planId: string;
  paymentId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  description?: string;
  onSuccess: (result: PaymentResult) => void;
  onCancel: () => void;
}

interface PaymentResult {
  paymentIntentId: string;
  planId: string;
  paymentId: string;
  amount: number;
  status: string;
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    background: "rgba(15, 15, 35, 0.95)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid rgba(0, 245, 255, 0.2)",
    maxWidth: 450,
    margin: "0 auto",
  } as React.CSSProperties,
  
  header: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    color: "#e2e8f0",
  } as React.CSSProperties,
  
  amount: {
    fontSize: 32,
    fontWeight: 700,
    background: "linear-gradient(90deg, #0ff, #f0f)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 24,
  } as React.CSSProperties,
  
  paymentElement: {
    marginBottom: 24,
  } as React.CSSProperties,
  
  button: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
  } as React.CSSProperties,
  
  primaryButton: {
    background: "linear-gradient(90deg, #0ff, #0aa)",
    color: "#000",
  } as React.CSSProperties,
  
  secondaryButton: {
    background: "rgba(100, 100, 120, 0.3)",
    color: "#e2e8f0",
    marginTop: 10,
  } as React.CSSProperties,
  
  error: {
    color: "#f87171",
    fontSize: 14,
    marginBottom: 16,
    padding: "10px 14px",
    background: "rgba(248, 113, 113, 0.1)",
    borderRadius: 8,
  } as React.CSSProperties,
  
  loading: {
    textAlign: "center" as const,
    padding: 40,
    color: "#94a3b8",
  } as React.CSSProperties,
};

// ============================================
// MAIN COMPONENT - Redirects to Stripe Checkout
// ============================================
export default function StripePaymentForm({
  planId,
  paymentId,
  amount,
  customerEmail,
  customerName,
  description,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/shop/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layaway: {
            plan_id: planId,
            payment_id: paymentId,
            description: description || "Layaway Payment",
          },
          amount,
          customer_email: customerEmail,
          customer_name: customerName,
          success_url: `${window.location.origin}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.message || "Failed to start checkout");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Unable to start checkout. Please try again.");
      setLoading(false);
    }
  };
  
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>💳 Secure Payment</h2>
      <div style={styles.amount}>${amount.toFixed(2)}</div>
      
      <p style={{ color: "#94a3b8", marginBottom: 20, fontSize: 14, textAlign: "center" }}>
        You'll be redirected to Stripe's secure checkout page where sales tax will be calculated based on your shipping address.
      </p>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          ...styles.button,
          ...styles.primaryButton,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Redirecting to Stripe..." : "Proceed to Checkout"}
      </button>
      
      <button
        onClick={onCancel}
        disabled={loading}
        style={{ ...styles.button, ...styles.secondaryButton }}
      >
        Cancel
      </button>
      
      <div style={{ marginTop: 20, textAlign: "center", color: "#64748b", fontSize: 12 }}>
        🔒 Payments secured by Stripe • Tax calculated automatically
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
  
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    color: "#94a3b8",
    fontSize: 14,
  } as React.CSSProperties,
};

// ============================================
// CHECKOUT FORM (Inside Elements Provider)
// ============================================
function CheckoutForm({
  planId,
  paymentId,
  amount,
  onSuccess,
  onCancel,
}: {
  planId: string;
  paymentId: string;
  amount: number;
  onSuccess: (result: PaymentResult) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError("");
    
    try {
      // Confirm the payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/shop/layaway?success=true`,
        },
        redirect: "if_required",
      });
      
      if (submitError) {
        setError(submitError.message || "Payment failed");
        setProcessing(false);
        return;
      }
      
      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm with our backend
        const confirmRes = await fetch("/api/shop/stripe/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            plan_id: planId,
            payment_id: paymentId,
          }),
        });
        
        const confirmData = await confirmRes.json();
        
        if (confirmData.ok) {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            planId,
            paymentId,
            amount,
            status: "succeeded",
          });
        } else {
          // Payment succeeded but backend update failed - still show success
          // Admin can reconcile later
          onSuccess({
            paymentIntentId: paymentIntent.id,
            planId,
            paymentId,
            amount,
            status: "succeeded",
          });
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.paymentElement}>
        <PaymentElement />
      </div>
      
      <label style={styles.checkbox}>
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        Save card for future payments
      </label>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.button,
          ...styles.primaryButton,
          opacity: processing ? 0.6 : 1,
        }}
      >
        {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        disabled={processing}
        style={{ ...styles.button, ...styles.secondaryButton }}
      >
        Cancel
      </button>
    </form>
  );
}

// ============================================
// MAIN COMPONENT
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
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    createPaymentIntent();
  }, []);
  
  const createPaymentIntent = async () => {
    try {
      const res = await fetch("/api/shop/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          payment_id: paymentId,
          amount,
          customer_email: customerEmail,
          customer_name: customerName,
          description,
          save_card: true,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError(data.message || "Failed to initialize payment");
      }
    } catch (err) {
      console.error("Failed to create payment intent:", err);
      setError("Unable to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>💳</div>
          Preparing secure checkout...
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button
          onClick={onCancel}
          style={{ ...styles.button, ...styles.secondaryButton }}
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (!clientSecret) {
    return null;
  }
  
  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#00f5ff",
      colorBackground: "#1a1a2e",
      colorText: "#e2e8f0",
      colorDanger: "#f87171",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "8px",
    },
  };
  
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>💳 Secure Payment</h2>
      <div style={styles.amount}>${amount.toFixed(2)}</div>
      
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance,
        }}
      >
        <CheckoutForm
          planId={planId}
          paymentId={paymentId}
          amount={amount}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
      
      <div style={{ marginTop: 20, textAlign: "center", color: "#64748b", fontSize: 12 }}>
        🔒 Payments secured by Stripe
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { calculateSalesTax, getAllStates } from "@/lib/salesTax";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
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

interface LayawaySettings {
  is_enabled: boolean;
  min_order_amount: number;
  max_order_amount: number;
  min_down_payment_percent: number;
  default_down_payment_percent: number;
  available_frequencies: string[];
  min_installments: number;
  max_installments: number;
}

interface LayawayConfig {
  downPaymentPercent: number;
  frequency: "weekly" | "biweekly" | "monthly";
  numPayments: number;
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

// Payment Form Component
function PaymentForm({ 
  amount, 
  onSuccess, 
  onError,
  customerInfo,
  cartItems,
  subtotal,
  shipping,
  tax,
  taxRate,
}: { 
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  customerInfo: CheckoutForm;
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  taxRate: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const response = await fetch("/api/shop/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          metadata: {
            items: JSON.stringify(cartItems.map(i => ({ name: i.name, qty: i.quantity }))),
            shipping_address: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`,
          },
        }),
      });

      const { clientSecret, error: intentError } = await response.json();
      
      if (intentError) {
        throw new Error(intentError);
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.zip,
              country: "US",
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Send order notification email and save to database
        try {
          await fetch("/api/shop/checkout/notify-stripe-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
              })),
              subtotal,
              shipping,
              tax,
              taxRate,
              total: amount,
              shippingAddress: {
                address: customerInfo.address,
                city: customerInfo.city,
                state: customerInfo.state,
                zip: customerInfo.zip,
              },
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send order notification:", emailErr);
          // Don't fail the order if email fails
        }
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ 
        padding: 16, 
        background: "rgba(30, 30, 50, 0.5)", 
        borderRadius: 8,
        marginBottom: 16
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#e2e8f0",
                "::placeholder": { color: "#64748b" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: processing ? "#555" : "linear-gradient(90deg, #0f0, #0a0)",
          color: "#000",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          cursor: processing ? "not-allowed" : "pointer",
        }}
      >
        {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
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
  const [showPayment, setShowPayment] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState("");
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "layaway">("card");
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const paypalRenderedRef = useRef(false);
  const [layawaySettings, setLayawaySettings] = useState<LayawaySettings | null>(null);
  const [layawayConfig, setLayawayConfig] = useState<LayawayConfig>({
    downPaymentPercent: 25,
    frequency: "biweekly",
    numPayments: 4,
  });
  const [createdPlanNumber, setCreatedPlanNumber] = useState<string | null>(null);

  // Load cart from localStorage and fetch current user on mount
  useEffect(() => {
    // Load cart from unified hbr-cart
    const savedCart = localStorage.getItem("hbr-cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    setLoading(false);
    
    // Fetch current user
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setCurrentUser({ id: data.user.id, email: data.user.email });
          // Pre-fill email if user is logged in
          if (data.user.email) {
            setCheckoutForm(prev => ({ ...prev, email: data.user.email }));
          }
        }
      })
      .catch(err => console.error("Failed to fetch user:", err));
    
    // Fetch layaway settings
    fetch("/api/shop/layaway/settings")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.settings) {
          setLayawaySettings(data.settings);
          setLayawayConfig(prev => ({
            ...prev,
            downPaymentPercent: data.settings.default_down_payment_percent || 25,
          }));
        }
      })
      .catch(err => console.error("Failed to fetch layaway settings:", err));
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const taxInfo = useMemo(() => {
    if (!checkoutForm.state) return { taxAmount: 0, taxRate: 0, stateAbbr: null };
    return calculateSalesTax(cartTotal, checkoutForm.state, false, SHIPPING_COST);
  }, [cartTotal, checkoutForm.state]);

  const taxAmount = taxInfo.taxAmount;
  const grandTotal = cartTotal + SHIPPING_COST + taxAmount;

  // Layaway calculations
  const layawayCalc = useMemo(() => {
    const downPayment = Math.round((grandTotal * layawayConfig.downPaymentPercent / 100) * 100) / 100;
    const remainingBalance = grandTotal - downPayment;
    const installmentAmount = Math.round((remainingBalance / layawayConfig.numPayments) * 100) / 100;
    return { downPayment, remainingBalance, installmentAmount };
  }, [grandTotal, layawayConfig]);

  // Check if layaway is available
  const layawayAvailable = useMemo(() => {
    if (!layawaySettings?.is_enabled) return false;
    if (cartTotal < (layawaySettings.min_order_amount || 100)) return false;
    if (cartTotal > (layawaySettings.max_order_amount || 5000)) return false;
    return true;
  }, [layawaySettings, cartTotal]);

  const handleFormChange = (field: keyof CheckoutForm, value: string) => {
    setCheckoutForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address ||
        !checkoutForm.city || !checkoutForm.state || !checkoutForm.zip) {
      setError("Please fill in all required fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleProceedToPayment = () => {
    if (validateForm()) {
      paypalRenderedRef.current = false; // Reset so PayPal can re-render
      setShowPayment(true);
    }
  };

  // Create layaway plan
  const handleCreateLayaway = async () => {
    if (!validateForm()) return;
    
    setError("");
    try {
      const response = await fetch("/api/shop/layaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: checkoutForm.name,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
            user_id: currentUser?.id || null,
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
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            image_url: item.image,
          })),
          plan_config: {
            down_payment_percent: layawayConfig.downPaymentPercent,
            payment_frequency: layawayConfig.frequency,
            num_payments: layawayConfig.numPayments,
          },
          notes: checkoutForm.notes,
        }),
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.message || "Failed to create layaway plan");
      }
      
      // Success! Show the created plan
      setCreatedPlanNumber(data.plan.plan_number);
      setOrderComplete(true);
      localStorage.removeItem("hbr-cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create layaway plan");
    }
  };

  const handlePaymentSuccess = () => {
    setOrderComplete(true);
    localStorage.removeItem("hbr-cart");
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
    setShowPayment(false);
  };

  // Render PayPal buttons when ready and PayPal is selected
  useEffect(() => {
    // Small delay to ensure the DOM element is mounted
    const timer = setTimeout(() => {
      const paypalWindow = window as unknown as { paypal?: { Buttons: (config: Record<string, unknown>) => { render: (el: HTMLElement) => void } } };
      
      if (
        paypalReady && 
        showPayment && 
        paymentMethod === "paypal" && 
        paypalButtonRef.current && 
        !paypalRenderedRef.current &&
        paypalWindow.paypal
      ) {
        paypalRenderedRef.current = true;
        
        paypalWindow.paypal.Buttons({
          createOrder: async () => {
            const response = await fetch("/api/shop/checkout/create-paypal-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: grandTotal,
                items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                shipping: {
                  name: checkoutForm.name,
                  address: checkoutForm.address,
                  city: checkoutForm.city,
                  state: checkoutForm.state,
                  zip: checkoutForm.zip,
                },
              }),
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.message);
            return data.orderID;
          },
          onApprove: async (data: { orderID: string }) => {
            const response = await fetch("/api/shop/checkout/capture-paypal-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            });
            const result = await response.json();
            if (result.ok) {
              handlePaymentSuccess();
            } else {
              setError(result.message || "PayPal payment failed");
            }
          },
          onError: (err: Error) => {
            setError(err.message || "PayPal error occurred");
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          },
        }).render(paypalButtonRef.current);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalReady, showPayment, paymentMethod, grandTotal]);

  // Reset PayPal button when going back to edit
  useEffect(() => {
    if (!showPayment) {
      paypalRenderedRef.current = false;
    }
  }, [showPayment]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", padding: 40, background: "#0a0a1a", color: "#e2e8f0" }}>
        <div style={{ textAlign: "center", padding: 60 }}>Loading...</div>
      </main>
    );
  }

  if (orderComplete) {
    return (
      <main style={{ minHeight: "100vh", padding: 40, background: "#0a0a1a", color: "#e2e8f0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>
            {createdPlanNumber ? "Layaway Plan Created!" : "Order Complete!"}
          </h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>
            Thank you for your order. A confirmation email has been sent to {checkoutForm.email}.
          </p>
          {createdPlanNumber && (
            <div style={{ 
              background: "rgba(0, 255, 255, 0.1)", 
              border: "1px solid #0ff",
              borderRadius: 12,
              padding: 20,
              marginBottom: 30
            }}>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Your Plan Number</div>
              <div style={{ fontSize: 24, fontFamily: "monospace", color: "#0ff", marginBottom: 12 }}>
                {createdPlanNumber}
              </div>
              <p style={{ fontSize: 14, opacity: 0.7 }}>
                Visit <Link href="/shop/layaway" style={{ color: "#0ff" }}>My Layaway Plans</Link> to view your plan and make payments.
              </p>
            </div>
          )}
          <Link
            href="/shop"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "linear-gradient(90deg, #0ff, #08f)",
              color: "#000",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
              marginRight: 12,
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main style={{ minHeight: "100vh", padding: 40, background: "#0a0a1a", color: "#e2e8f0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>Your Cart is Empty</h1>
          <p style={{ opacity: 0.7, marginBottom: 30 }}>
            Add some items to your cart before checking out.
          </p>
          <Link
            href="/shop"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "linear-gradient(90deg, #0ff, #08f)",
              color: "#000",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Browse Shop
          </Link>
        </div>
      </main>
    );
  }

  // Check if PayPal is properly configured
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const isPaypalConfigured = paypalClientId.length > 20;

  return (
    <main style={{ minHeight: "100vh", padding: 40, background: "#0a0a1a", color: "#e2e8f0" }}>
      {/* PayPal SDK Script - load early so it's ready when needed */}
      {isPaypalConfigured && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture&components=buttons`}
          onLoad={() => {
            setPaypalReady(true);
          }}
          onError={(e) => {
            console.error("Failed to load PayPal SDK:", e);
            setError("PayPal is temporarily unavailable. Please use card payment.");
          }}
          strategy="afterInteractive"
        />
      )}
      
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/shop" style={{ color: "#0ff", textDecoration: "none", marginBottom: 20, display: "inline-block" }}>
          ← Back to Shop
        </Link>
        
        <h1 style={{ fontSize: 32, marginBottom: 30 }}>Checkout</h1>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.2)", 
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            color: "#fca5a5"
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 40 }}>
          {/* Left: Form */}
          <div>
            {!showPayment ? (
              <>
                <h2 style={{ fontSize: 20, marginBottom: 20 }}>Shipping Information</h2>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>Full Name *</label>
                      <input
                        type="text"
                        value={checkoutForm.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        style={inputStyle}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>Email *</label>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        style={inputStyle}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>Phone</label>
                    <input
                      type="tel"
                      value={checkoutForm.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      style={inputStyle}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>Street Address *</label>
                    <input
                      type="text"
                      value={checkoutForm.address}
                      onChange={(e) => handleFormChange("address", e.target.value)}
                      style={inputStyle}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>City *</label>
                      <input
                        type="text"
                        value={checkoutForm.city}
                        onChange={(e) => handleFormChange("city", e.target.value)}
                        style={inputStyle}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>State *</label>
                      <select
                        value={checkoutForm.state}
                        onChange={(e) => handleFormChange("state", e.target.value)}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value="">Select</option>
                        {getAllStates().map(state => (
                          <option key={state.abbr} value={state.abbr}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>ZIP *</label>
                      <input
                        type="text"
                        value={checkoutForm.zip}
                        onChange={(e) => handleFormChange("zip", e.target.value)}
                        style={inputStyle}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14, opacity: 0.7 }}>Order Notes</label>
                    <textarea
                      value={checkoutForm.notes}
                      onChange={(e) => handleFormChange("notes", e.target.value)}
                      style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <h2 style={{ fontSize: 20, marginTop: 30, marginBottom: 20 }}>Payment Method</h2>
                <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                  {/* Credit/Debit Card Option */}
                  <label 
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      padding: 16,
                      background: paymentMethod === "card" ? "rgba(0, 255, 255, 0.1)" : "rgba(30, 30, 50, 0.3)",
                      border: paymentMethod === "card" ? "2px solid #0ff" : "1px solid rgba(100, 100, 120, 0.3)",
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      style={{ marginRight: 12, accentColor: "#0ff" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>💳 Credit / Debit Card</div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>Pay ${grandTotal.toFixed(2)} securely with Stripe</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#0ff" }}>${grandTotal.toFixed(2)}</div>
                  </label>

                  {/* PayPal Option */}
                  <label 
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      padding: 16,
                      background: paymentMethod === "paypal" ? "rgba(0, 112, 186, 0.15)" : "rgba(30, 30, 50, 0.3)",
                      border: paymentMethod === "paypal" ? "2px solid #0070ba" : "1px solid rgba(100, 100, 120, 0.3)",
                      borderRadius: 12,
                      cursor: isPaypalConfigured ? "pointer" : "not-allowed",
                      opacity: isPaypalConfigured ? 1 : 0.5,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "paypal"}
                      onChange={() => isPaypalConfigured && setPaymentMethod("paypal")}
                      disabled={!isPaypalConfigured}
                      style={{ marginRight: 12, accentColor: "#0070ba" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ color: "#003087", fontWeight: 700 }}>Pay</span>
                        <span style={{ color: "#0070ba", fontWeight: 700 }}>Pal</span>
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>
                        {isPaypalConfigured 
                          ? "Pay with your PayPal account or card"
                          : "PayPal is currently unavailable"
                        }
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#0070ba" }}>${grandTotal.toFixed(2)}</div>
                  </label>

                  {/* Layaway Option */}
                  <label 
                    style={{ 
                      display: "flex",
                      alignItems: "flex-start",
                      padding: 16,
                      background: paymentMethod === "layaway" ? "rgba(240, 0, 255, 0.1)" : "rgba(30, 30, 50, 0.3)",
                      border: paymentMethod === "layaway" ? "2px solid #f0f" : "1px solid rgba(100, 100, 120, 0.3)",
                      borderRadius: 12,
                      cursor: layawayAvailable ? "pointer" : "not-allowed",
                      opacity: layawayAvailable ? 1 : 0.5,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "layaway"}
                      onChange={() => layawayAvailable && setPaymentMethod("layaway")}
                      disabled={!layawayAvailable}
                      style={{ marginRight: 12, marginTop: 4, accentColor: "#f0f" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        Layaway Plan
                        {!layawayAvailable && layawaySettings && (
                          <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 8, color: "#f87171" }}>
                            (Min ${layawaySettings.min_order_amount} order)
                          </span>
                        )}
                      </div>
                      {layawayAvailable && (
                        <div style={{ fontSize: 13, opacity: 0.7 }}>
                          ${layawayCalc.downPayment.toFixed(2)} down, then {layawayConfig.numPayments} payments of ${layawayCalc.installmentAmount.toFixed(2)}
                        </div>
                      )}
                      {!layawayAvailable && !layawaySettings?.is_enabled && (
                        <div style={{ fontSize: 13, opacity: 0.7 }}>Layaway is currently unavailable</div>
                      )}
                    </div>
                    {layawayAvailable && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#f0f" }}>${layawayCalc.downPayment.toFixed(2)}</div>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>due today</div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Layaway Configuration (shown when layaway selected) */}
                {paymentMethod === "layaway" && layawayAvailable && (
                  <div style={{ 
                    background: "rgba(240, 0, 255, 0.05)", 
                    border: "1px solid rgba(240, 0, 255, 0.2)",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 24
                  }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16, color: "#f0f" }}>Customize Your Plan</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.7 }}>Down Payment</label>
                        <select
                          value={layawayConfig.downPaymentPercent}
                          onChange={(e) => setLayawayConfig(prev => ({ ...prev, downPaymentPercent: Number(e.target.value) }))}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        >
                          {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                            <option key={pct} value={pct}>{pct}% (${(grandTotal * pct / 100).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.7 }}>Frequency</label>
                        <select
                          value={layawayConfig.frequency}
                          onChange={(e) => setLayawayConfig(prev => ({ ...prev, frequency: e.target.value as "weekly" | "biweekly" | "monthly" }))}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, opacity: 0.7 }}>Payments</label>
                        <select
                          value={layawayConfig.numPayments}
                          onChange={(e) => setLayawayConfig(prev => ({ ...prev, numPayments: Number(e.target.value) }))}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        >
                          {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                            <option key={n} value={n}>{n} payments</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: 16, 
                      padding: 12, 
                      background: "rgba(0,0,0,0.3)", 
                      borderRadius: 8,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      textAlign: "center",
                      fontSize: 13
                    }}>
                      <div>
                        <div style={{ opacity: 0.6 }}>Down Payment</div>
                        <div style={{ fontWeight: 600, color: "#f0f" }}>${layawayCalc.downPayment.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ opacity: 0.6 }}>Each Payment</div>
                        <div style={{ fontWeight: 600 }}>${layawayCalc.installmentAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ opacity: 0.6 }}>Total</div>
                        <div style={{ fontWeight: 600 }}>${grandTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={paymentMethod === "layaway" ? handleCreateLayaway : handleProceedToPayment}
                  style={{
                    marginTop: 24,
                    width: "100%",
                    padding: "14px 24px",
                    background: paymentMethod === "layaway" 
                      ? "linear-gradient(90deg, #f0f, #a0f)" 
                      : paymentMethod === "paypal"
                      ? "linear-gradient(90deg, #0070ba, #003087)"
                      : "linear-gradient(90deg, #0ff, #08f)",
                    color: paymentMethod === "paypal" ? "#fff" : "#000",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {paymentMethod === "layaway" 
                    ? `Create Layaway Plan (${layawayConfig.downPaymentPercent}% Down)`
                    : "Continue to Payment"}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20 }}>Payment</h2>
                  <button
                    onClick={() => setShowPayment(false)}
                    style={{ background: "none", border: "none", color: "#0ff", cursor: "pointer" }}
                  >
                    ← Edit Shipping
                  </button>
                </div>
                <div style={{ 
                  background: "rgba(30, 30, 50, 0.3)", 
                  borderRadius: 8, 
                  padding: 16, 
                  marginBottom: 24,
                  fontSize: 14,
                  opacity: 0.8
                }}>
                  <div><strong>Ship to:</strong></div>
                  <div>{checkoutForm.name}</div>
                  <div>{checkoutForm.address}</div>
                  <div>{checkoutForm.city}, {checkoutForm.state} {checkoutForm.zip}</div>
                </div>
                
                {paymentMethod === "card" ? (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={grandTotal}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      customerInfo={checkoutForm}
                      cartItems={cart}
                      subtotal={cartTotal}
                      shipping={SHIPPING_COST}
                      tax={taxAmount}
                      taxRate={taxInfo.taxRate}
                    />
                  </Elements>
                ) : paymentMethod === "paypal" ? (
                  <div>
                    {isPaypalConfigured ? (
                      <>
                        <div 
                          ref={paypalButtonRef} 
                          style={{ minHeight: 150 }}
                        >
                          {!paypalReady ? (
                            <div style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
                              Loading PayPal...
                            </div>
                          ) : !paypalRenderedRef.current ? (
                            <div style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
                              Initializing PayPal buttons...
                            </div>
                          ) : null}
                        </div>
                        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.6, textAlign: "center" }}>
                          You&apos;ll be redirected to PayPal to complete your payment securely.
                        </p>
                      </>
                    ) : (
                      <div style={{ 
                        textAlign: "center", 
                        padding: 30, 
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div>
                        <p style={{ color: "#fca5a5", marginBottom: 8 }}>PayPal is not configured</p>
                        <p style={{ fontSize: 13, opacity: 0.7 }}>Please select Credit/Debit Card instead</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      amount={grandTotal}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      customerInfo={checkoutForm}
                      cartItems={cart}
                      subtotal={cartTotal}
                      shipping={SHIPPING_COST}
                      tax={taxAmount}
                      taxRate={taxInfo.taxRate}
                    />
                  </Elements>
                )}
              </>
            )}
          </div>

          {/* Right: Order Summary */}
          <div>
            <div style={{ 
              background: "rgba(30, 30, 50, 0.5)", 
              borderRadius: 12, 
              padding: 24,
              position: "sticky",
              top: 20
            }}>
              <h2 style={{ fontSize: 18, marginBottom: 20 }}>Order Summary</h2>
              
              <div style={{ marginBottom: 20 }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottom: "1px solid rgba(100,100,120,0.2)"
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      {item.size && <div style={{ fontSize: 12, opacity: 0.6 }}>Size: {item.size}</div>}
                      <div style={{ fontSize: 12, opacity: 0.6 }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(100,100,120,0.3)", paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ opacity: 0.7 }}>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ opacity: 0.7 }}>Shipping</span>
                  <span>${SHIPPING_COST.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ opacity: 0.7 }}>Tax ({checkoutForm.state})</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontWeight: 700, 
                  fontSize: 18,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(100,100,120,0.3)"
                }}>
                  <span>Total</span>
                  <span style={{ color: "#0ff" }}>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

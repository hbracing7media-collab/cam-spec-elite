"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Script from "next/script";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CAM_MAKE_OPTIONS, CAM_ENGINE_FAMILIES, CamMakeKey } from "@/lib/engineOptions";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ConsultingService {
  id: string;
  title: string;
  description: string;
  includes: string[];
  price: number;
  duration: string;
  icon: string;
}

const services: ConsultingService[] = [
  {
    id: "engine-build",
    title: "Engine Build Consulting",
    description: "Complete guidance on building your performance engine from the ground up.",
    includes: [
      "Block and rotating assembly selection",
      "Cam and valvetrain recommendations",
      "Cylinder head selection and flow analysis",
      "Compression ratio optimization",
      "Parts compatibility verification",
      "Build sequence guidance",
    ],
    price: 150,
    duration: "1-2 hours",
    icon: "🔧",
  },
  {
    id: "race-engine",
    title: "Race Engine Consulting",
    description: "Specialized advice for serious racers. Maximize your power-to-dollar ratio.",
    includes: [
      "Class rules compliance review",
      "Power target strategy",
      "Cooling and oiling system design",
      "Weight reduction opportunities",
      "Dyno tuning recommendations",
      "Race day preparation checklist",
    ],
    price: 200,
    duration: "2-3 hours",
    icon: "🏁",
  },
  {
    id: "parts-consulting",
    title: "Performance Parts Consulting",
    description: "Cut through the marketing BS. Spend your money where it makes power.",
    includes: [
      "Brand and quality comparison",
      "Best value recommendations",
      "Avoid common mistakes",
      "Vendor reliability insights",
      "Used vs. new part guidance",
      "Budget optimization",
    ],
    price: 75,
    duration: "30-60 min",
    icon: "🛠️",
  },
  {
    id: "build-strategy",
    title: "Build Strategy Consulting",
    description: "Create a roadmap that makes sense financially and mechanically.",
    includes: [
      "Phase-by-phase build plan",
      "Budget allocation strategy",
      "Timeline recommendations",
      "Future-proofing decisions",
      "Upgrade priority ranking",
      "Long-term maintenance planning",
    ],
    price: 125,
    duration: "1-2 hours",
    icon: "📋",
  },
];

// Stripe Payment Form Component
function StripePaymentForm({ 
  amount, 
  onSuccess, 
  onError,
  customerInfo,
  serviceName,
}: { 
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  customerInfo: { name: string; email: string; phone: string };
  serviceName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const response = await fetch("/api/shop/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          metadata: {
            type: "consulting",
            service: serviceName,
          },
        }),
      });

      const { clientSecret, error: intentError } = await response.json();
      
      if (intentError) throw new Error(intentError);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === "succeeded") onSuccess(paymentIntent.id);
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

export default function ConsultingPage() {
  const [selectedService, setSelectedService] = useState<ConsultingService | null>(null);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [paypalReady, setPaypalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    make: "" as CamMakeKey | "",
    engineFamily: "",
    description: "",
  });

  const engineFamilies = useMemo(() => {
    if (!formData.make) return [];
    return CAM_ENGINE_FAMILIES[formData.make as CamMakeKey] || [];
  }, [formData.make]);

  // Reset engine family when make changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, engineFamily: "" }));
  }, [formData.make]);

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

  const validateForm = () => {
    if (!formData.name.trim()) return "Please enter your name";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email";
    }
    if (!formData.make) return "Please select a make";
    if (!formData.engineFamily) return "Please select an engine family";
    if (!formData.description.trim()) return "Please describe what you're looking for";
    return null;
  };

  const handleContinueToPayment = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep("payment");
  };

  const handlePaymentSuccess = async (paymentMethod: "stripe" | "paypal" = "stripe", paymentId?: string) => {
    // Send booking confirmation emails
    try {
      await fetch("/api/shop/consulting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          serviceName: selectedService?.title,
          servicePrice: selectedService?.price,
          engineMake: formData.make,
          engineFamily: formData.engineFamily,
          description: formData.description,
          paymentMethod,
          paymentId,
        }),
      });
    } catch (err) {
      console.error("Failed to send confirmation emails:", err);
    }
    setStep("success");
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const closeModal = () => {
    setSelectedService(null);
    setStep("details");
    setError(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      make: "",
      engineFamily: "",
      description: "",
    });
  };

  // PayPal initialization
  useEffect(() => {
    if (selectedService && step === "payment" && paymentMethod === "paypal") {
      const checkPayPal = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).paypal) {
          setPaypalReady(true);
          clearInterval(checkPayPal);
        }
      }, 100);
      return () => clearInterval(checkPayPal);
    }
  }, [selectedService, step, paymentMethod]);

  useEffect(() => {
    if (paypalReady && selectedService && step === "payment" && paymentMethod === "paypal") {
      const container = document.getElementById("paypal-button-container");
      if (container && container.childNodes.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
          createOrder: async () => {
            const response = await fetch("/api/shop/checkout/create-paypal-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: selectedService.price,
                items: [{ name: selectedService.title, quantity: 1, price: selectedService.price }],
                shipping: { name: formData.name },
              }),
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.message);
            return data.orderID;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onApprove: async (data: any) => {
            handlePaymentSuccess("paypal", data.orderID);
          },
          onError: (err: Error) => {
            setError(err.message || "PayPal payment failed");
          },
        }).render("#paypal-button-container");
      }
    }
  }, [paypalReady, selectedService, step, paymentMethod, formData.name]);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      {/* PayPal SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
        strategy="lazyOnload"
      />

      {/* Back link */}
      <Link 
        href="/shop" 
        style={{ 
          color: "#00f5ff", 
          textDecoration: "none", 
          fontSize: 14, 
          display: "inline-block",
          marginBottom: 24,
        }}
      >
        ← Back to Shop
      </Link>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#00ff88",
          margin: "0 0 12px 0",
          textShadow: "0 0 30px rgba(0, 255, 136, 0.3)",
        }}>
          ⚡ Performance Build Advisory
        </h1>
        <p style={{ 
          color: "#e2e8f0", 
          fontSize: 18, 
          margin: 0,
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          No fluff — you&apos;ll instantly understand what you&apos;re paying for.
        </p>
      </div>

      {/* Services Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        marginBottom: 48,
      }}>
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => setSelectedService(service)}
            style={{
              background: "rgba(10, 10, 30, 0.8)",
              border: "1px solid rgba(100, 100, 120, 0.3)",
              borderRadius: 12,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 255, 136, 0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(100, 100, 120, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{service.icon}</div>
            <h3 style={{ color: "#e2e8f0", fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>
              {service.title}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              {service.description}
            </p>
            
            <ul style={{ 
              margin: "0 0 16px 0", 
              paddingLeft: 16, 
              color: "#94a3b8", 
              fontSize: 12,
              lineHeight: 1.8,
            }}>
              {service.includes.slice(0, 3).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
              {service.includes.length > 3 && (
                <li style={{ color: "#64748b" }}>+ {service.includes.length - 3} more...</li>
              )}
            </ul>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              paddingTop: 16,
              borderTop: "1px solid rgba(100, 100, 120, 0.2)",
            }}>
              <div>
                <div style={{ color: "#00ff88", fontSize: 24, fontWeight: 800 }}>
                  ${service.price}
                </div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{service.duration}</div>
              </div>
              <div style={{
                background: "linear-gradient(135deg, #00ff88, #00c9ff)",
                color: "#0a0a1e",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
              }}>
                Book Now →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedService && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              zIndex: 1000,
            }}
          />
          
          {/* Modal Content */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 520,
            maxHeight: "90vh",
            overflowY: "auto",
            background: "linear-gradient(135deg, #0a0a1e, #1a1a2e)",
            border: "1px solid rgba(0, 255, 136, 0.3)",
            borderRadius: 16,
            padding: 32,
            zIndex: 1001,
          }}>
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{selectedService.icon}</div>
              <h2 style={{ color: "#00ff88", fontSize: 22, fontWeight: 700, margin: "0 0 4px 0" }}>
                {selectedService.title}
              </h2>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
                ${selectedService.price} • {selectedService.duration}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: "#fca5a5",
                fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {step === "details" && (
              <>
                {/* Contact Info */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Contact Information
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Engine Selection */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Engine Information
                  </h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    <select
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value as CamMakeKey })}
                      style={inputStyle}
                    >
                      <option value="">Select Make *</option>
                      {CAM_MAKE_OPTIONS.map((make) => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                    <select
                      value={formData.engineFamily}
                      onChange={(e) => setFormData({ ...formData, engineFamily: e.target.value })}
                      style={inputStyle}
                      disabled={!formData.make}
                    >
                      <option value="">Select Engine Family *</option>
                      {engineFamilies.map((family) => (
                        <option key={family} value={family}>{family}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    What are you looking for?
                  </h3>
                  <textarea
                    placeholder="Describe your project, goals, current setup, questions, etc. *"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                  />
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinueToPayment}
                  style={{
                    width: "100%",
                    padding: "16px 32px",
                    background: "linear-gradient(135deg, #00ff88, #00c9ff)",
                    color: "#0a0a1e",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Continue to Payment — ${selectedService.price}
                </button>
              </>
            )}

            {step === "payment" && (
              <>
                {/* Summary */}
                <div style={{
                  background: "rgba(0, 255, 136, 0.1)",
                  border: "1px solid rgba(0, 255, 136, 0.2)",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Service:</span>
                    <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{selectedService.title}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#94a3b8" }}>Engine:</span>
                    <span style={{ color: "#e2e8f0" }}>{formData.make} - {formData.engineFamily}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(100,100,120,0.3)", paddingTop: 8, marginTop: 8 }}>
                    <span style={{ color: "#e2e8f0", fontWeight: 700 }}>Total:</span>
                    <span style={{ color: "#00ff88", fontWeight: 800, fontSize: 18 }}>${selectedService.price}</span>
                  </div>
                </div>

                {/* Payment Method Toggle */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={() => setPaymentMethod("stripe")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: paymentMethod === "stripe" ? "rgba(99, 102, 241, 0.2)" : "rgba(30, 30, 50, 0.5)",
                      border: paymentMethod === "stripe" ? "2px solid #6366f1" : "1px solid rgba(100, 100, 120, 0.3)",
                      borderRadius: 8,
                      color: paymentMethod === "stripe" ? "#a5b4fc" : "#94a3b8",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💳 Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("paypal")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: paymentMethod === "paypal" ? "rgba(0, 112, 186, 0.2)" : "rgba(30, 30, 50, 0.5)",
                      border: paymentMethod === "paypal" ? "2px solid #0070ba" : "1px solid rgba(100, 100, 120, 0.3)",
                      borderRadius: 8,
                      color: paymentMethod === "paypal" ? "#00a0dc" : "#94a3b8",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🅿️ PayPal
                  </button>
                </div>

                {/* Payment Form */}
                {paymentMethod === "stripe" ? (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={selectedService.price}
                      onSuccess={(paymentId) => handlePaymentSuccess("stripe", paymentId)}
                      onError={handlePaymentError}
                      customerInfo={{
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                      }}
                      serviceName={selectedService.title}
                    />
                  </Elements>
                ) : (
                  <div id="paypal-button-container" style={{ minHeight: 150 }}>
                    {!paypalReady && (
                      <div style={{ textAlign: "center", padding: 20, color: "#64748b" }}>
                        Loading PayPal...
                      </div>
                    )}
                  </div>
                )}

                {/* Back Button */}
                <button
                  onClick={() => setStep("details")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "transparent",
                    border: "1px solid rgba(100, 100, 120, 0.3)",
                    borderRadius: 8,
                    color: "#94a3b8",
                    fontSize: 14,
                    cursor: "pointer",
                    marginTop: 12,
                  }}
                >
                  ← Back to Details
                </button>
              </>
            )}

            {step === "success" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "#00ff88", fontSize: 24, fontWeight: 700, margin: "0 0 12px 0" }}>
                  Payment Successful!
                </h2>
                <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
                  Thank you for booking! We&apos;ll contact you within 24-48 hours at{" "}
                  <strong style={{ color: "#e2e8f0" }}>{formData.email}</strong> to schedule your consultation.
                </p>
                <button
                  onClick={closeModal}
                  style={{
                    padding: "12px 32px",
                    background: "linear-gradient(135deg, #00ff88, #00c9ff)",
                    color: "#0a0a1e",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* FAQ Section */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: "center" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            {
              q: "How does the consultation work?",
              a: "After payment, we'll email you to schedule a call or video chat. Sessions can be done over the phone, Zoom, or Discord.",
            },
            {
              q: "What if I need more time?",
              a: "We can extend the session at a prorated rate, or book a follow-up session at a discounted rate.",
            },
            {
              q: "Do you offer ongoing support?",
              a: "Yes! After your session, you'll have email access for quick follow-up questions for 30 days.",
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(10, 10, 30, 0.6)",
                border: "1px solid rgba(100, 100, 120, 0.2)",
                borderRadius: 10,
                padding: 20,
              }}
            >
              <h4 style={{ color: "#00f5ff", fontSize: 15, fontWeight: 600, margin: "0 0 8px 0" }}>
                {faq.q}
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

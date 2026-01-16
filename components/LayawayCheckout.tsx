"use client";

import { useState, useEffect, useMemo } from "react";

// ============================================
// TYPES
// ============================================
interface LayawaySettings {
  is_enabled: boolean;
  min_order_amount: number;
  max_order_amount: number;
  min_down_payment_percent: number;
  default_down_payment_percent: number;
  available_frequencies: string[];
  min_installments: number;
  max_installments: number;
  max_plan_duration_days: number;
  late_fee_amount: number;
  grace_period_days: number;
  affirm_enabled: boolean;
  sezzle_enabled: boolean;
  afterpay_enabled: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image_url?: string;
}

interface LayawayCheckoutProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
    user_id?: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  onSuccess: (plan: LayawayPlan) => void;
  onCancel: () => void;
}

interface LayawayPlan {
  id: string;
  plan_number: string;
  down_payment_amount: number;
  payment_amount: number;
  num_payments: number;
  payment_frequency: string;
  total_amount: number;
  final_payment_due: string;
}

interface PaymentScheduleItem {
  payment_number: number;
  amount: number;
  due_date: Date;
  label: string;
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
  } as React.CSSProperties,
  
  header: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    background: "linear-gradient(90deg, #0ff, #f0f)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties,
  
  section: {
    marginBottom: 24,
    padding: 16,
    background: "rgba(30, 30, 60, 0.5)",
    borderRadius: 12,
  } as React.CSSProperties,
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0ff",
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  } as React.CSSProperties,
  
  label: {
    display: "block",
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 6,
  } as React.CSSProperties,
  
  select: {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(10, 10, 30, 0.8)",
    border: "1px solid rgba(100, 100, 120, 0.3)",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 14,
    cursor: "pointer",
  } as React.CSSProperties,
  
  slider: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    background: "rgba(100, 100, 120, 0.3)",
    appearance: "none" as const,
    cursor: "pointer",
  } as React.CSSProperties,
  
  scheduleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(100, 100, 120, 0.2)",
  } as React.CSSProperties,
  
  highlightValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0ff",
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
  
  vendorButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "12px 20px",
    borderRadius: 8,
    border: "1px solid rgba(100, 100, 120, 0.3)",
    background: "rgba(30, 30, 60, 0.5)",
    color: "#e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: 10,
  } as React.CSSProperties,
  
  vendorLogo: {
    height: 24,
    width: "auto",
  } as React.CSSProperties,
  
  error: {
    color: "#f87171",
    fontSize: 13,
    marginTop: 8,
    padding: "8px 12px",
    background: "rgba(248, 113, 113, 0.1)",
    borderRadius: 6,
  } as React.CSSProperties,
  
  info: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 8,
  } as React.CSSProperties,
};

// ============================================
// COMPONENT
// ============================================
export default function LayawayCheckout({
  cartItems,
  subtotal,
  shippingCost,
  taxAmount,
  customer,
  shipping,
  onSuccess,
  onCancel,
}: LayawayCheckoutProps) {
  // State
  const [settings, setSettings] = useState<LayawaySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Plan configuration
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [paymentFrequency, setPaymentFrequency] = useState<"weekly" | "biweekly" | "monthly">("biweekly");
  const [numPayments, setNumPayments] = useState(4);
  
  const totalAmount = subtotal + shippingCost + taxAmount;
  
  // Fetch layaway settings
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/shop/layaway/settings");
      const data = await res.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
        setDownPaymentPercent(data.settings.default_down_payment_percent || 25);
      }
    } catch (err) {
      console.error("Failed to load layaway settings:", err);
      setError("Unable to load layaway options");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate payment schedule
  const paymentSchedule = useMemo(() => {
    const downPayment = Math.round((totalAmount * downPaymentPercent / 100) * 100) / 100;
    const remainingBalance = totalAmount - downPayment;
    const installmentAmount = Math.round((remainingBalance / numPayments) * 100) / 100;
    
    const schedule: PaymentScheduleItem[] = [];
    const now = new Date();
    
    // Down payment (due today)
    schedule.push({
      payment_number: 0,
      amount: downPayment,
      due_date: now,
      label: "Down Payment (Due Today)",
    });
    
    // Installments
    for (let i = 1; i <= numPayments; i++) {
      const dueDate = new Date(now);
      switch (paymentFrequency) {
        case "weekly":
          dueDate.setDate(dueDate.getDate() + 7 * i);
          break;
        case "biweekly":
          dueDate.setDate(dueDate.getDate() + 14 * i);
          break;
        case "monthly":
          dueDate.setMonth(dueDate.getMonth() + i);
          break;
      }
      
      // Adjust last payment for rounding
      const isLastPayment = i === numPayments;
      const paidSoFar = downPayment + (installmentAmount * (i - 1));
      const amount = isLastPayment 
        ? Math.round((totalAmount - paidSoFar) * 100) / 100
        : installmentAmount;
      
      schedule.push({
        payment_number: i,
        amount,
        due_date: dueDate,
        label: `Payment ${i} of ${numPayments}`,
      });
    }
    
    return schedule;
  }, [totalAmount, downPaymentPercent, numPayments, paymentFrequency]);
  
  // Check if plan duration exceeds max
  const planDuration = useMemo(() => {
    if (paymentSchedule.length < 2) return 0;
    const start = paymentSchedule[0].due_date;
    const end = paymentSchedule[paymentSchedule.length - 1].due_date;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [paymentSchedule]);
  
  const exceedsMaxDuration = settings ? planDuration > settings.max_plan_duration_days : false;
  
  // Handle internal layaway submission
  const handleSubmitLayaway = async () => {
    setError("");
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/shop/layaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shipping,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            image_url: item.image_url,
          })),
          plan_config: {
            down_payment_percent: downPaymentPercent,
            payment_frequency: paymentFrequency,
            num_payments: numPayments,
          },
          payment_provider: "internal",
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.plan) {
        onSuccess(data.plan);
      } else {
        setError(data.message || "Failed to create layaway plan");
      }
    } catch (err) {
      console.error("Layaway submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle Affirm checkout
  const handleAffirmCheckout = async () => {
    setError("");
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/shop/affirm/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          shipping,
          items: cartItems,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok && data.checkout) {
        // Launch Affirm checkout modal
        // Note: Requires Affirm SDK to be loaded on page
        if (typeof window !== "undefined" && (window as { affirm?: { checkout: (config: unknown) => void } }).affirm) {
          (window as { affirm: { checkout: (config: unknown) => void } }).affirm.checkout(data.checkout.checkout_data);
        } else {
          setError("Affirm is not available. Please try our layaway option instead.");
        }
      } else {
        setError(data.message || "Failed to start Affirm checkout");
      }
    } catch (err) {
      console.error("Affirm checkout error:", err);
      setError("Unable to connect to Affirm. Please try our layaway option.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
          Loading payment options...
        </div>
      </div>
    );
  }
  
  // Check eligibility
  if (!settings?.is_enabled) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: 40, color: "#f87171" }}>
          Layaway is currently unavailable.
        </div>
        <button 
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={onCancel}
        >
          Back to Checkout
        </button>
      </div>
    );
  }
  
  if (subtotal < settings.min_order_amount) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>💳 Payment Plans</h2>
        <div style={{ textAlign: "center", padding: 20, color: "#f87171" }}>
          Minimum order for layaway is ${settings.min_order_amount.toFixed(2)}.
          <br />
          Your cart total: ${subtotal.toFixed(2)}
        </div>
        <button 
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={onCancel}
        >
          Back to Checkout
        </button>
      </div>
    );
  }
  
  const downPaymentAmount = paymentSchedule[0]?.amount || 0;
  const installmentAmount = paymentSchedule[1]?.amount || 0;
  
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>💳 Payment Plans</h2>
      
      {/* Vendor Options (Affirm, etc.) */}
      {(settings.affirm_enabled || settings.sezzle_enabled || settings.afterpay_enabled) && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Buy Now, Pay Later</div>
          
          {settings.affirm_enabled && (
            <button
              style={styles.vendorButton}
              onClick={handleAffirmCheckout}
              disabled={submitting}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 123, 255, 0.5)";
                e.currentTarget.style.background = "rgba(0, 123, 255, 0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "rgba(100, 100, 120, 0.3)";
                e.currentTarget.style.background = "rgba(30, 30, 60, 0.5)";
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>affirm</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Pay over time. As low as 0% APR.
              </span>
            </button>
          )}
          
          {settings.sezzle_enabled && (
            <button
              style={styles.vendorButton}
              disabled
              title="Coming soon"
            >
              <span style={{ fontSize: 16, fontWeight: 600 }}>Sezzle</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Coming soon</span>
            </button>
          )}
          
          {settings.afterpay_enabled && (
            <button
              style={styles.vendorButton}
              disabled
              title="Coming soon"
            >
              <span style={{ fontSize: 16, fontWeight: 600 }}>Afterpay</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Coming soon</span>
            </button>
          )}
          
          <div style={{ ...styles.info, textAlign: "center", marginTop: 16 }}>
            — OR use our in-house layaway —
          </div>
        </div>
      )}
      
      {/* Custom Layaway Configuration */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🏪 HB Racing Layaway</div>
        
        {/* Down Payment Slider */}
        <div style={{ marginBottom: 20 }}>
          <label style={styles.label}>
            Down Payment: <span style={{ color: "#0ff", fontWeight: 600 }}>
              {downPaymentPercent}% (${downPaymentAmount.toFixed(2)})
            </span>
          </label>
          <input
            type="range"
            min={settings.min_down_payment_percent}
            max={50}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={{ display: "flex", justifyContent: "space-between", ...styles.info }}>
            <span>{settings.min_down_payment_percent}%</span>
            <span>50%</span>
          </div>
        </div>
        
        {/* Payment Frequency */}
        <div style={{ marginBottom: 20 }}>
          <label style={styles.label}>Payment Frequency</label>
          <select
            value={paymentFrequency}
            onChange={(e) => setPaymentFrequency(e.target.value as "weekly" | "biweekly" | "monthly")}
            style={styles.select}
          >
            {settings.available_frequencies.includes("weekly") && (
              <option value="weekly">Weekly</option>
            )}
            {settings.available_frequencies.includes("biweekly") && (
              <option value="biweekly">Every 2 Weeks</option>
            )}
            {settings.available_frequencies.includes("monthly") && (
              <option value="monthly">Monthly</option>
            )}
          </select>
        </div>
        
        {/* Number of Payments */}
        <div style={{ marginBottom: 20 }}>
          <label style={styles.label}>
            Number of Payments: <span style={{ color: "#0ff", fontWeight: 600 }}>
              {numPayments} × ${installmentAmount.toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min={settings.min_installments}
            max={settings.max_installments}
            step={1}
            value={numPayments}
            onChange={(e) => setNumPayments(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={{ display: "flex", justifyContent: "space-between", ...styles.info }}>
            <span>{settings.min_installments} payments</span>
            <span>{settings.max_installments} payments</span>
          </div>
        </div>
        
        {exceedsMaxDuration && (
          <div style={styles.error}>
            ⚠️ Plan duration ({planDuration} days) exceeds maximum of {settings.max_plan_duration_days} days.
            Try fewer payments or a higher frequency.
          </div>
        )}
      </div>
      
      {/* Payment Schedule Preview */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📅 Payment Schedule</div>
        
        {paymentSchedule.map((payment, idx) => (
          <div key={idx} style={styles.scheduleRow}>
            <div>
              <div style={{ fontWeight: payment.payment_number === 0 ? 700 : 400, color: "#e2e8f0" }}>
                {payment.label}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {payment.due_date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
            <div style={{
              ...styles.highlightValue,
              color: payment.payment_number === 0 ? "#0ff" : "#e2e8f0",
            }}>
              ${payment.amount.toFixed(2)}
            </div>
          </div>
        ))}
        
        {/* Total */}
        <div style={{ ...styles.scheduleRow, borderBottom: "none", marginTop: 10 }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0" }}>Total</div>
          <div style={styles.highlightValue}>${totalAmount.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Terms */}
      <div style={{ ...styles.info, marginBottom: 20 }}>
        <strong style={{ color: "#f0f" }}>Layaway Terms:</strong>
        <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
          <li>Late payments incur a ${settings.late_fee_amount.toFixed(2)} fee after {settings.grace_period_days}-day grace period</li>
          <li>Cancellation fee: {settings.cancellation_fee_percent}% of amount paid</li>
          <li>Items held until plan is complete or cancelled</li>
        </ul>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {/* Action Buttons */}
      <button
        style={{
          ...styles.button,
          ...styles.primaryButton,
          opacity: submitting || exceedsMaxDuration ? 0.5 : 1,
        }}
        onClick={handleSubmitLayaway}
        disabled={submitting || exceedsMaxDuration}
      >
        {submitting ? "Creating Plan..." : `Start Layaway — Pay $${downPaymentAmount.toFixed(2)} Today`}
      </button>
      
      <button
        style={{ ...styles.button, ...styles.secondaryButton }}
        onClick={onCancel}
        disabled={submitting}
      >
        Back to Checkout
      </button>
    </div>
  );
}

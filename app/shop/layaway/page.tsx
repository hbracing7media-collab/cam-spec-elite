"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import Stripe form to avoid SSR issues
const StripePaymentForm = dynamic(
  () => import("@/components/StripePaymentForm"),
  { ssr: false }
);

// ============================================
// TYPES
// ============================================
interface LayawayPlan {
  id: string;
  plan_number: string;
  customer_name: string;
  customer_email: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    image_url?: string;
  }>;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  down_payment_amount: number;
  remaining_balance: number;
  amount_paid: number;
  payment_frequency: string;
  num_payments: number;
  payment_amount: number;
  start_date: string;
  next_payment_due: string | null;
  final_payment_due: string;
  status: string;
  payment_provider: string;
  created_at: string;
  completed_at: string | null;
  layaway_payments?: LayawayPayment[];
}

interface LayawayPayment {
  id: string;
  plan_id: string;
  payment_number: number;
  amount: number;
  late_fee: number;
  total_charged: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  payment_method: string | null;
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: 20,
  } as React.CSSProperties,
  
  header: {
    marginBottom: 30,
  } as React.CSSProperties,
  
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    background: "linear-gradient(90deg, #0ff, #f0f)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 8,
  } as React.CSSProperties,
  
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
  } as React.CSSProperties,
  
  card: {
    background: "rgba(15, 15, 35, 0.95)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    border: "1px solid rgba(0, 245, 255, 0.15)",
  } as React.CSSProperties,
  
  planHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap" as const,
    gap: 16,
  } as React.CSSProperties,
  
  planNumber: {
    fontSize: 14,
    color: "#0ff",
    fontFamily: "monospace",
    marginBottom: 4,
  } as React.CSSProperties,
  
  statusBadge: (status: string) => ({
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    ...getStatusColors(status),
  }) as React.CSSProperties,
  
  progressBar: {
    width: "100%",
    height: 8,
    background: "rgba(100, 100, 120, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  } as React.CSSProperties,
  
  progressFill: (percent: number) => ({
    width: `${percent}%`,
    height: "100%",
    background: "linear-gradient(90deg, #0ff, #0aa)",
    borderRadius: 4,
    transition: "width 0.3s ease",
  }) as React.CSSProperties,
  
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  
  statCard: {
    background: "rgba(30, 30, 60, 0.5)",
    padding: 16,
    borderRadius: 10,
    textAlign: "center" as const,
  } as React.CSSProperties,
  
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0ff",
    marginBottom: 4,
  } as React.CSSProperties,
  
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  
  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "rgba(30, 30, 60, 0.3)",
    borderRadius: 8,
    marginBottom: 8,
  } as React.CSSProperties,
  
  button: {
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
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
    border: "1px solid rgba(100, 100, 120, 0.3)",
  } as React.CSSProperties,
  
  emptyState: {
    textAlign: "center" as const,
    padding: 60,
    color: "#94a3b8",
  } as React.CSSProperties,
  
  itemsList: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1px solid rgba(100, 100, 120, 0.2)",
  } as React.CSSProperties,
  
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(100, 100, 120, 0.1)",
  } as React.CSSProperties,
};

function getStatusColors(status: string) {
  switch (status) {
    case "active":
      return { background: "rgba(0, 245, 255, 0.2)", color: "#0ff" };
    case "completed":
      return { background: "rgba(34, 197, 94, 0.2)", color: "#22c55e" };
    case "pending_down_payment":
      return { background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" };
    case "defaulted":
    case "forfeited":
      return { background: "rgba(248, 113, 113, 0.2)", color: "#f87171" };
    case "cancelled":
      return { background: "rgba(148, 163, 184, 0.2)", color: "#94a3b8" };
    default:
      return { background: "rgba(100, 100, 120, 0.2)", color: "#94a3b8" };
  }
}

function getPaymentStatusColors(status: string) {
  switch (status) {
    case "paid":
      return { color: "#22c55e" };
    case "due":
      return { color: "#fbbf24" };
    case "overdue":
      return { color: "#f87171" };
    case "pending":
      return { color: "#94a3b8" };
    default:
      return { color: "#94a3b8" };
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFrequency(freq: string) {
  switch (freq) {
    case "weekly": return "Weekly";
    case "biweekly": return "Bi-weekly";
    case "monthly": return "Monthly";
    default: return freq;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending_down_payment": return "Awaiting Down Payment";
    case "active": return "Active";
    case "completed": return "Completed";
    case "defaulted": return "Defaulted";
    case "cancelled": return "Cancelled";
    case "forfeited": return "Forfeited";
    default: return status;
  }
}

// ============================================
// COMPONENT
// ============================================
export default function LayawayDashboardPage() {
  const [plans, setPlans] = useState<LayawayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPlanNumber, setLookupPlanNumber] = useState("");
  
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: LayawayPlan | null;
    payment: LayawayPayment | null;
  }>({ isOpen: false, plan: null, payment: null });
  
  // Fetch user's plans
  useEffect(() => {
    // In a real app, get user email from session
    // For now, we'll use a lookup form
  }, []);
  
  const handleLookup = async () => {
    setError("");
    setLoading(true);
    
    try {
      let url = "/api/shop/layaway?";
      if (lookupPlanNumber) {
        url += `plan_number=${encodeURIComponent(lookupPlanNumber)}`;
      } else if (lookupEmail) {
        url += `email=${encodeURIComponent(lookupEmail)}`;
      } else {
        setError("Please enter your email or plan number");
        setLoading(false);
        return;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.ok) {
        // Single plan lookup returns 'plan', multiple returns 'plans'
        if (data.plan) {
          setPlans([data.plan]);
        } else if (data.plans) {
          setPlans(data.plans);
        } else {
          setPlans([]);
        }
      } else {
        setError(data.message || "No layaway plans found");
        setPlans([]);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Failed to look up layaway plans");
    } finally {
      setLoading(false);
    }
  };
  
  const handleMakePayment = (plan: LayawayPlan, payment: LayawayPayment) => {
    setPaymentModal({
      isOpen: true,
      plan,
      payment,
    });
  };
  
  const handlePaymentSuccess = async () => {
    // Close modal
    setPaymentModal({ isOpen: false, plan: null, payment: null });
    
    // Refresh the plan data
    if (lookupPlanNumber || lookupEmail) {
      await handleLookup();
    }
  };
  
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)",
        padding: "20px",
      }}
    >
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <Link href="/shop" style={{ color: "#0ff", textDecoration: "none", fontSize: 14 }}>
            ← Back to Shop
          </Link>
          <h1 style={styles.title}>My Layaway Plans</h1>
          <p style={styles.subtitle}>
            View and manage your layaway payment plans
          </p>
        </div>
        
        {/* Lookup Form */}
        <div style={styles.card}>
          <h3 style={{ color: "#e2e8f0", marginBottom: 16, fontSize: 16 }}>
            🔍 Find Your Layaway Plan
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Plan Number (LAY-XXXXXXXX-XXXX)"
              value={lookupPlanNumber}
              onChange={(e) => setLookupPlanNumber(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "12px 14px",
                background: "rgba(30, 30, 60, 0.5)",
                border: "1px solid rgba(100, 100, 120, 0.3)",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
              }}
            />
            <span style={{ color: "#64748b", alignSelf: "center" }}>or</span>
            <input
              type="email"
              placeholder="Your email address"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "12px 14px",
                background: "rgba(30, 30, 60, 0.5)",
                border: "1px solid rgba(100, 100, 120, 0.3)",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleLookup}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Look Up
            </button>
          </div>
          {error && (
            <p style={{ color: "#f87171", marginTop: 12, fontSize: 14 }}>{error}</p>
          )}
        </div>
        
        {/* Plans List */}
        {loading && plans.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Enter your email or plan number to view your layaway plans.</p>
          </div>
        ) : plans.length === 0 && !loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p>No layaway plans found.</p>
            <Link href="/shop/parts" style={{ color: "#0ff", marginTop: 10, display: "inline-block" }}>
              Browse our shop →
            </Link>
          </div>
        ) : (
          plans.map((plan) => {
            const progressPercent = (plan.amount_paid / plan.total_amount) * 100;
            const isExpanded = expandedPlan === plan.id;
            
            return (
              <div key={plan.id} style={styles.card}>
                {/* Plan Header */}
                <div style={styles.planHeader}>
                  <div>
                    <div style={styles.planNumber}>{plan.plan_number}</div>
                    <div style={{ color: "#e2e8f0", fontSize: 14 }}>
                      Created {formatDate(plan.created_at)}
                    </div>
                  </div>
                  <div style={styles.statusBadge(plan.status)}>
                    {getStatusLabel(plan.status)}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>
                      ${plan.amount_paid.toFixed(2)} paid of ${plan.total_amount.toFixed(2)}
                    </span>
                    <span style={{ color: "#0ff", fontSize: 12, fontWeight: 600 }}>
                      {progressPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill(progressPercent)} />
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>${plan.remaining_balance.toFixed(2)}</div>
                    <div style={styles.statLabel}>Remaining</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>${plan.payment_amount.toFixed(2)}</div>
                    <div style={styles.statLabel}>Per Payment</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{formatFrequency(plan.payment_frequency)}</div>
                    <div style={styles.statLabel}>Frequency</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{formatDate(plan.next_payment_due)}</div>
                    <div style={styles.statLabel}>Next Due</div>
                  </div>
                </div>
                
                {/* Payment Schedule (Expandable) */}
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                    width: "100%",
                    marginBottom: isExpanded ? 16 : 0,
                  }}
                >
                  {isExpanded ? "Hide Details ▲" : "View Payment Schedule ▼"}
                </button>
                
                {isExpanded && plan.layaway_payments && (
                  <>
                    <h4 style={{ color: "#0ff", fontSize: 14, marginBottom: 12 }}>
                      Payment Schedule
                    </h4>
                    {plan.layaway_payments
                      .sort((a, b) => a.payment_number - b.payment_number)
                      .map((payment) => (
                        <div key={payment.id} style={styles.paymentRow}>
                          <div>
                            <div style={{ color: "#e2e8f0", fontWeight: 500 }}>
                              {payment.payment_number === 0 
                                ? "Down Payment" 
                                : `Payment ${payment.payment_number}`}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              Due: {formatDate(payment.due_date)}
                              {payment.paid_at && ` • Paid: ${formatDate(payment.paid_at)}`}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                                ${payment.amount.toFixed(2)}
                                {payment.late_fee > 0 && (
                                  <span style={{ color: "#f87171", fontSize: 12 }}>
                                    {" "}+${payment.late_fee.toFixed(2)} fee
                                  </span>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: 11, 
                                textTransform: "uppercase",
                                ...getPaymentStatusColors(payment.status)
                              }}>
                                {payment.status}
                              </div>
                            </div>
                            {(payment.status === "due" || payment.status === "overdue") && (
                              <button
                                onClick={() => handleMakePayment(plan, payment)}
                                style={{ ...styles.button, ...styles.primaryButton, padding: "8px 16px" }}
                              >
                                Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    
                    {/* Items in Plan */}
                    <div style={styles.itemsList}>
                      <h4 style={{ color: "#0ff", fontSize: 14, marginBottom: 12 }}>
                        Items on Layaway
                      </h4>
                      {plan.items.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                          <div style={{ 
                            width: 50, 
                            height: 50, 
                            background: "rgba(30, 30, 60, 0.5)",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                          }}>
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                              />
                            ) : "📦"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#e2e8f0", fontWeight: 500 }}>{item.name}</div>
                            <div style={{ color: "#94a3b8", fontSize: 12 }}>
                              Qty: {item.quantity}
                              {item.size && ` • Size: ${item.size}`}
                            </div>
                          </div>
                          <div style={{ color: "#0ff", fontWeight: 600 }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Provider Badge */}
                {plan.payment_provider !== "internal" && (
                  <div style={{ 
                    marginTop: 16, 
                    padding: 12, 
                    background: "rgba(100, 100, 120, 0.1)", 
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>
                      Managed by <strong style={{ color: "#e2e8f0" }}>{plan.payment_provider}</strong>
                    </span>
                    <a 
                      href={`https://www.${plan.payment_provider}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0ff", fontSize: 13 }}
                    >
                      View on {plan.payment_provider} →
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Help Section */}
        <div style={{ ...styles.card, background: "rgba(0, 245, 255, 0.05)" }}>
          <h3 style={{ color: "#e2e8f0", marginBottom: 12, fontSize: 16 }}>
            ❓ Need Help?
          </h3>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
            Questions about your layaway plan? Contact us at{" "}
            <a href="mailto:support@hbracing7.com" style={{ color: "#0ff" }}>
              support@hbracing7.com
            </a>{" "}
            or call <a href="tel:+1234567890" style={{ color: "#0ff" }}>(123) 456-7890</a>.
          </p>
          <ul style={{ color: "#94a3b8", fontSize: 13, marginTop: 12, marginLeft: 20 }}>
            <li>Late payments: 7-day grace period before fees apply</li>
            <li>Cancellations: 10% fee on amount already paid</li>
            <li>Completed plans: Items ship within 2-3 business days</li>
          </ul>
        </div>
      </div>
      
      {/* Payment Modal */}
      {paymentModal.isOpen && paymentModal.plan && paymentModal.payment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setPaymentModal({ isOpen: false, plan: null, payment: null })}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <StripePaymentForm
              planId={paymentModal.plan.id}
              paymentId={paymentModal.payment.id}
              amount={paymentModal.payment.total_charged}
              customerEmail={paymentModal.plan.customer_email}
              customerName={paymentModal.plan.customer_name}
              description={`Layaway Payment - ${paymentModal.plan.plan_number} - Payment ${paymentModal.payment.payment_number === 0 ? "Down Payment" : paymentModal.payment.payment_number}`}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentModal({ isOpen: false, plan: null, payment: null })}
            />
          </div>
        </div>
      )}
    </main>
  );
}

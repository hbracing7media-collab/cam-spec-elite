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

interface ProfileLayawayConsoleProps {
  userEmail: string;
  userId?: string;
}

// ============================================
// HELPERS
// ============================================
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
export default function ProfileLayawayConsole({ userEmail, userId }: ProfileLayawayConsoleProps) {
  const [plans, setPlans] = useState<LayawayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: LayawayPlan | null;
    payment: LayawayPayment | null;
  }>({ isOpen: false, plan: null, payment: null });
  
  // Load user's layaway plans
  useEffect(() => {
    loadPlans();
  }, [userEmail, userId]);
  
  const loadPlans = async () => {
    setLoading(true);
    setError("");
    
    try {
      let url = "/api/shop/layaway?";
      if (userId) {
        url += `user_id=${encodeURIComponent(userId)}`;
      } else if (userEmail) {
        url += `email=${encodeURIComponent(userEmail)}`;
      } else {
        setLoading(false);
        return;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.ok) {
        if (data.plan) {
          setPlans([data.plan]);
        } else if (data.plans) {
          setPlans(data.plans);
        } else {
          setPlans([]);
        }
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error("Failed to load layaway plans:", err);
      setError("Failed to load layaway plans");
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
    setPaymentModal({ isOpen: false, plan: null, payment: null });
    await loadPlans();
  };

  // Styles
  const styles = {
    card: {
      background: "rgba(15, 15, 35, 0.6)",
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      border: "1px solid rgba(0, 245, 255, 0.15)",
    } as React.CSSProperties,
    
    planHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
      flexWrap: "wrap" as const,
      gap: 12,
    } as React.CSSProperties,
    
    planNumber: {
      fontSize: 13,
      color: "#0ff",
      fontFamily: "monospace",
      marginBottom: 2,
    } as React.CSSProperties,
    
    statusBadge: (status: string) => ({
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 16,
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase" as const,
      ...getStatusColors(status),
    }) as React.CSSProperties,
    
    progressBar: {
      width: "100%",
      height: 6,
      background: "rgba(100, 100, 120, 0.3)",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 6,
    } as React.CSSProperties,
    
    progressFill: (percent: number) => ({
      width: `${percent}%`,
      height: "100%",
      background: "linear-gradient(90deg, #0ff, #0aa)",
      borderRadius: 3,
      transition: "width 0.3s ease",
    }) as React.CSSProperties,
    
    statsRow: {
      display: "flex",
      gap: 12,
      marginBottom: 16,
      flexWrap: "wrap" as const,
    } as React.CSSProperties,
    
    statBox: {
      flex: "1 1 100px",
      background: "rgba(30, 30, 60, 0.5)",
      padding: "10px 12px",
      borderRadius: 8,
      textAlign: "center" as const,
    } as React.CSSProperties,
    
    statValue: {
      fontSize: 16,
      fontWeight: 700,
      color: "#0ff",
    } as React.CSSProperties,
    
    statLabel: {
      fontSize: 10,
      color: "#94a3b8",
      textTransform: "uppercase" as const,
    } as React.CSSProperties,
    
    paymentRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 12px",
      background: "rgba(30, 30, 60, 0.3)",
      borderRadius: 6,
      marginBottom: 6,
    } as React.CSSProperties,
    
    button: {
      padding: "8px 16px",
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 12,
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
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
        Loading layaway plans...
      </div>
    );
  }
  
  if (plans.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
        <p style={{ marginBottom: 16 }}>No layaway plans found</p>
        <Link 
          href="/shop/camshafts" 
          style={{ 
            color: "#0ff", 
            textDecoration: "none",
            padding: "8px 16px",
            background: "rgba(0, 245, 255, 0.1)",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          Browse Shop & Use Layaway →
        </Link>
      </div>
    );
  }

  // Get active/pending plans first
  const sortedPlans = [...plans].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      active: 0,
      pending_down_payment: 1,
      completed: 2,
      cancelled: 3,
      defaulted: 4,
      forfeited: 5,
    };
    return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
  });

  return (
    <div>
      {error && (
        <div style={{ color: "#f87171", marginBottom: 16, fontSize: 13 }}>{error}</div>
      )}
      
      {sortedPlans.map((plan) => {
        const progressPercent = (plan.amount_paid / plan.total_amount) * 100;
        const isExpanded = expandedPlan === plan.id;
        const nextDuePayment = plan.layaway_payments?.find(
          p => p.status === "due" || p.status === "overdue"
        );
        
        return (
          <div key={plan.id} style={styles.card}>
            {/* Plan Header */}
            <div style={styles.planHeader}>
              <div>
                <div style={styles.planNumber}>{plan.plan_number}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {formatDate(plan.created_at)}
                </div>
              </div>
              <div style={styles.statusBadge(plan.status)}>
                {getStatusLabel(plan.status)}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  ${plan.amount_paid.toFixed(2)} / ${plan.total_amount.toFixed(2)}
                </span>
                <span style={{ color: "#0ff", fontSize: 11, fontWeight: 600 }}>
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(progressPercent)} />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>${plan.remaining_balance.toFixed(2)}</div>
                <div style={styles.statLabel}>Remaining</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>${plan.payment_amount.toFixed(2)}</div>
                <div style={styles.statLabel}>{formatFrequency(plan.payment_frequency)}</div>
              </div>
              <div style={styles.statBox}>
                <div style={{ ...styles.statValue, fontSize: 13 }}>{formatDate(plan.next_payment_due)}</div>
                <div style={styles.statLabel}>Next Due</div>
              </div>
            </div>
            
            {/* Quick Pay Button */}
            {nextDuePayment && (plan.status === "active" || plan.status === "pending_down_payment") && (
              <button
                onClick={() => handleMakePayment(plan, nextDuePayment)}
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton, 
                  width: "100%",
                  padding: "12px 16px",
                  marginBottom: 12,
                }}
              >
                💳 Pay ${nextDuePayment.total_charged.toFixed(2)} Now
                {nextDuePayment.status === "overdue" && " (Overdue)"}
              </button>
            )}
            
            {/* Expand/Collapse */}
            <button
              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                width: "100%",
                fontSize: 11,
              }}
            >
              {isExpanded ? "Hide Details ▲" : "View Details ▼"}
            </button>
            
            {/* Expanded Details */}
            {isExpanded && (
              <div style={{ marginTop: 16 }}>
                {/* Payment Schedule */}
                {plan.layaway_payments && plan.layaway_payments.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: "#0ff", fontSize: 12, marginBottom: 10, textTransform: "uppercase" }}>
                      Payment Schedule
                    </h4>
                    {plan.layaway_payments
                      .sort((a, b) => a.payment_number - b.payment_number)
                      .map((payment) => (
                        <div key={payment.id} style={styles.paymentRow}>
                          <div>
                            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}>
                              {payment.payment_number === 0 
                                ? "Down Payment" 
                                : `Payment ${payment.payment_number}`}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {payment.status === "paid" 
                                ? `Paid ${formatDate(payment.paid_at)}`
                                : `Due ${formatDate(payment.due_date)}`}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>
                                ${payment.amount.toFixed(2)}
                                {payment.late_fee > 0 && (
                                  <span style={{ color: "#f87171", fontSize: 11 }}>
                                    {" "}+${payment.late_fee.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: 10, 
                                textTransform: "uppercase",
                                ...getPaymentStatusColors(payment.status)
                              }}>
                                {payment.status}
                              </div>
                            </div>
                            {(payment.status === "due" || payment.status === "overdue") && (
                              <button
                                onClick={() => handleMakePayment(plan, payment)}
                                style={{ ...styles.button, ...styles.primaryButton, padding: "6px 12px", fontSize: 11 }}
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                {/* Items */}
                <div>
                  <h4 style={{ color: "#0ff", fontSize: 12, marginBottom: 10, textTransform: "uppercase" }}>
                    Items ({plan.items.length})
                  </h4>
                  {plan.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 10, 
                        padding: "8px 0",
                        borderBottom: idx < plan.items.length - 1 ? "1px solid rgba(100,100,120,0.2)" : "none"
                      }}
                    >
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        background: "rgba(30, 30, 60, 0.5)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}>
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
                          />
                        ) : "📦"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>
                          Qty: {item.quantity}{item.size && ` • ${item.size}`}
                        </div>
                      </div>
                      <div style={{ color: "#0ff", fontWeight: 600, fontSize: 13 }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* View Full Page Link */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link 
          href="/shop/layaway" 
          style={{ color: "#0ff", fontSize: 13, textDecoration: "none" }}
        >
          View Full Layaway Dashboard →
        </Link>
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
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
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
              description={`Layaway - ${paymentModal.plan.plan_number} - ${
                paymentModal.payment.payment_number === 0 
                  ? "Down Payment" 
                  : `Payment ${paymentModal.payment.payment_number}`
              }`}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentModal({ isOpen: false, plan: null, payment: null })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

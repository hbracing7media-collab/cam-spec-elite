"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import Stripe form to avoid SSR issues
const StripePaymentForm = dynamic(
  () => import("@/components/StripePaymentForm"),
  { ssr: false }
);

interface QuoteItem {
  id?: string;
  name: string;
  sku?: string;
  size?: string;
  quantity: number;
  price: number;
  image_url?: string;
  description?: string;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: QuoteItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  discount_amount: number;
  discount_description: string;
  suggested_down_payment_percent: number;
  suggested_down_payment_amount: number;
  suggested_payment_frequency: string;
  suggested_num_payments: number;
  suggested_payment_amount: number;
  valid_until: string;
  status: string;
  customer_notes: string;
  created_at: string;
}

export default function QuoteViewPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.quoteId as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [acceptedPlan, setAcceptedPlan] = useState<any>(null);
  
  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/shop/layaway/quote/${quoteId}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.message || "Quote not found");
      } else {
        setQuote(data.quote);
      }
    } catch (err) {
      setError("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/shop/layaway/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.message || "Failed to accept quote");
        setProcessing(false);
        return;
      }

      // Quote accepted, layaway plan created - now show Stripe payment
      setAcceptedPlan(data.plan);
      setQuote((prev) => prev ? { ...prev, status: "accepted" } : null);
      setShowPaymentForm(true);
    } catch (err) {
      alert("Failed to accept quote");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = (result: any) => {
    setShowPaymentForm(false);
    setPaymentComplete(true);
  };

  const handlePaymentCancel = () => {
    // User cancelled payment - plan is still created, they can pay later
    setShowPaymentForm(false);
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/shop/layaway/quote/${quoteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", decline_reason: declineReason }),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.message || "Failed to decline quote");
      } else {
        setQuote((prev) => prev ? { ...prev, status: "declined" } : null);
        setShowDeclineModal(false);
      }
    } catch (err) {
      alert("Failed to decline quote");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "weekly": return "Weekly";
      case "biweekly": return "Every 2 Weeks";
      case "monthly": return "Monthly";
      default: return freq;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading quote...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/50 text-red-200 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Quote Not Found</h2>
          <p>{error || "This quote does not exist or has been removed."}</p>
        </div>
      </div>
    );
  }

  const isExpired = quote.status === "expired" || new Date(quote.valid_until) < new Date();
  const isPending = quote.status === "pending" && !isExpired;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-t-lg p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">HB Racing</h1>
              <p className="text-gray-400">Performance Engineering</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>170 Roby Rd. Reagan TN 38368</p>
                <p>731-798-9563</p>
                <p>Hbracing77@yahoo.com</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">QUOTE</div>
              <div className="text-gray-400 mt-1">#{quote.quote_number}</div>
              <div className="text-sm text-gray-500 mt-2">
                Date: {formatDate(quote.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Status Banners */}
        {paymentComplete && (
          <div className="bg-green-900/50 border-l-4 border-green-500 p-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-green-200 font-semibold">Payment Complete!</p>
                <p className="text-green-300 text-sm">
                  Your layaway plan is now active. You can view your payment schedule in your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {quote.status === "accepted" && !paymentComplete && !showPaymentForm && (
          <div className="bg-blue-900/50 border-l-4 border-blue-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 font-semibold">Quote Accepted - Down Payment Required</p>
                <p className="text-blue-300 text-sm">
                  Complete your down payment to activate the layaway plan.
                </p>
              </div>
              {acceptedPlan && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stripe Payment Form Modal */}
        {showPaymentForm && acceptedPlan && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="max-w-lg w-full">
              <StripePaymentForm
                planId={acceptedPlan.id}
                paymentId={acceptedPlan.down_payment_id}
                amount={acceptedPlan.down_payment_amount}
                customerEmail={quote.customer_email}
                customerName={quote.customer_name}
                description={`Down Payment - ${acceptedPlan.plan_number}`}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}

        {quote.status === "declined" && (
          <div className="bg-red-900/50 border-l-4 border-red-500 p-4">
            <p className="text-red-200 font-semibold">Quote Declined</p>
          </div>
        )}

        {isExpired && quote.status !== "accepted" && quote.status !== "declined" && (
          <div className="bg-yellow-900/50 border-l-4 border-yellow-500 p-4">
            <p className="text-yellow-200 font-semibold">Quote Expired</p>
            <p className="text-yellow-300 text-sm">This quote expired on {formatDate(quote.valid_until)}</p>
          </div>
        )}

        {/* Customer Info */}
        <div className="bg-gray-800 p-6 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-gray-400 text-sm font-semibold mb-2">BILL TO</h3>
              <p className="text-white font-medium">{quote.customer_name}</p>
              <p className="text-gray-400">{quote.customer_email}</p>
              {quote.customer_phone && <p className="text-gray-400">{quote.customer_phone}</p>}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Valid Until</div>
              <div className={`text-lg font-semibold ${isExpired ? "text-red-400" : "text-green-400"}`}>
                {formatDate(quote.valid_until)}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="text-left p-4 text-gray-300 font-semibold">Description</th>
                <th className="text-center p-4 text-gray-300 font-semibold w-20">Qty</th>
                <th className="text-right p-4 text-gray-300 font-semibold w-32">Unit Price</th>
                <th className="text-right p-4 text-gray-300 font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-4">
                    <div className="text-white">{item.name}</div>
                    {item.sku && <div className="text-gray-500 text-sm">SKU: {item.sku}</div>}
                    {item.description && <div className="text-gray-400 text-sm mt-1">{item.description}</div>}
                  </td>
                  <td className="p-4 text-center text-gray-300">{item.quantity}</td>
                  <td className="p-4 text-right text-gray-300">{formatCurrency(item.price)}</td>
                  <td className="p-4 text-right text-white font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="bg-gray-800 p-6 border-t border-gray-700">
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2 text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between py-2 text-green-400">
                  <span>Discount {quote.discount_description && `(${quote.discount_description})`}</span>
                  <span>-{formatCurrency(quote.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-gray-400">
                <span>Shipping</span>
                <span>{formatCurrency(quote.shipping_cost)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-500 text-sm italic">
                <span>Sales Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between py-3 text-xl font-bold text-white border-t border-gray-600 mt-2">
                <span>Total (before tax)</span>
                <span>{formatCurrency(quote.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Plan Details */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">Layaway Payment Plan</h3>
          <p className="text-gray-400 text-sm mb-4">Sales tax will be added to your down payment at checkout.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-gray-400 text-sm">Down Payment ({quote.suggested_down_payment_percent}%)</div>
              <div className="text-xl font-bold text-white">{formatCurrency(quote.suggested_down_payment_amount)}</div>
              <div className="text-gray-500 text-xs mt-1">+ tax at checkout</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-gray-400 text-sm">Number of Payments</div>
              <div className="text-xl font-bold text-white">{quote.suggested_num_payments}</div>
              <div className="text-gray-500 text-xs mt-1">{getFrequencyLabel(quote.suggested_payment_frequency)}</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-gray-400 text-sm">Payment Amount</div>
              <div className="text-xl font-bold text-white">{formatCurrency(quote.suggested_payment_amount)}</div>
              <div className="text-gray-500 text-xs mt-1">Per installment</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-gray-400 text-sm">Total (before tax)</div>
              <div className="text-xl font-bold text-green-400">{formatCurrency(quote.total_amount)}</div>
              <div className="text-gray-500 text-xs mt-1">All payments combined</div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.customer_notes && (
          <div className="bg-gray-800 p-6 rounded-lg mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{quote.customer_notes}</p>
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Accept Quote & Pay Down Payment"}
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={processing}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg text-lg transition-colors disabled:opacity-50"
            >
              Decline Quote
            </button>
          </div>
        )}

        {/* Terms */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>All sales final, applicable sales tax added at checkout.</p>
          <p className="mt-2">Quotation prepared by: Phillip Hudson</p>
        </div>

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Decline Quote</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to decline this quote? Please let us know why (optional):
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining..."
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                rows={3}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDecline}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Confirm Decline"}
                </button>
                <button
                  onClick={() => setShowDeclineModal(false)}
                  disabled={processing}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

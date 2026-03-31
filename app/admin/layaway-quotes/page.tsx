"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QuoteItem {
  name: string;
  quantity: number;
  price: number;
  description?: string;
  sku?: string;
}

interface LayawayQuote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: QuoteItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  discount_amount: number;
  discount_description: string | null;
  suggested_down_payment_percent: number;
  suggested_down_payment_amount: number;
  suggested_payment_frequency: string;
  suggested_num_payments: number;
  suggested_payment_amount: number;
  valid_until: string;
  status: string;
  customer_notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

const emptyItem: QuoteItem = { name: "", quantity: 1, price: 0, description: "" };

export default function AdminLayawayQuotesPage() {
  const router = useRouter();
  
  const [checking, setChecking] = useState(true);
  const [quotes, setQuotes] = useState<LayawayQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Form state for creating new quote
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([{ ...emptyItem }]);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountDescription, setDiscountDescription] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [numPayments, setNumPayments] = useState(4);
  const [paymentFrequency, setPaymentFrequency] = useState("biweekly");
  const [validDays, setValidDays] = useState(14);
  const [customerNotes, setCustomerNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected quote for viewing
  const [selectedQuote, setSelectedQuote] = useState<LayawayQuote | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      router.replace("/auth/login");
    } else {
      setChecking(false);
      loadQuotes();
    }
  };

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/layaway-quotes", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setQuotes(data.quotes);
      } else {
        setMessage("Error loading quotes: " + data.message);
      }
    } catch (err) {
      setMessage("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost + taxAmount - discountAmount;
  };

  const calculateDownPayment = () => {
    return Math.round((calculateTotal() * downPaymentPercent / 100) * 100) / 100;
  };

  const calculatePaymentAmount = () => {
    const remaining = calculateTotal() - calculateDownPayment();
    return Math.round((remaining / numPayments) * 100) / 100;
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerEmail || items.length === 0) {
      setMessage("Please fill in customer name, email, and at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/layaway-quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || undefined,
          },
          items: items.filter(item => item.name && item.price > 0),
          plan_config: {
            down_payment_percent: downPaymentPercent,
            payment_frequency: paymentFrequency,
            num_payments: numPayments,
          },
          discount: discountAmount > 0 ? {
            amount: discountAmount,
            description: discountDescription,
          } : undefined,
          valid_days: validDays,
          customer_notes: customerNotes || undefined,
          admin_notes: adminNotes || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        setMessage(`Quote created! URL: ${data.quote_url}`);
        resetForm();
        setShowForm(false);
        loadQuotes();
      } else {
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      setMessage("Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setItems([{ ...emptyItem }]);
    setShippingCost(0);
    setTaxAmount(0);
    setDiscountAmount(0);
    setDiscountDescription("");
    setDownPaymentPercent(25);
    setNumPayments(4);
    setPaymentFrequency("biweekly");
    setValidDays(14);
    setCustomerNotes("");
    setAdminNotes("");
  };

  const handleCancelQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to cancel this quote?")) return;
    
    try {
      const res = await fetch(`/api/admin/layaway-quotes?id=${quoteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      
      if (data.ok) {
        setMessage("Quote cancelled");
        loadQuotes();
      } else {
        setMessage("Error: " + data.message);
      }
    } catch (err) {
      setMessage("Failed to cancel quote");
    }
  };

  const copyQuoteUrl = (quoteId: string) => {
    const url = `${window.location.origin}/shop/layaway/quote/${quoteId}`;
    navigator.clipboard.writeText(url);
    setMessage("Quote URL copied to clipboard!");
    setTimeout(() => setMessage(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-600 text-yellow-100",
      accepted: "bg-green-600 text-green-100",
      declined: "bg-red-600 text-red-100",
      expired: "bg-gray-600 text-gray-100",
      cancelled: "bg-gray-700 text-gray-300",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-gray-600"}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Layaway Quotes</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "+ New Quote"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200">
            {message}
            <button onClick={() => setMessage(null)} className="ml-4 text-blue-400 hover:text-blue-300">×</button>
          </div>
        )}

        {/* Create Quote Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Quote</h2>
            <form onSubmit={handleSubmitQuote}>
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-300 text-sm">Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        className="w-20 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(index, "price", parseFloat(e.target.value) || 0)}
                        className="w-28 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={item.description || ""}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Shipping</label>
                  <input
                    type="number"
                    value={shippingCost || ""}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Tax</label>
                  <div className="w-full p-2 bg-gray-600 text-gray-400 rounded border border-gray-600 text-sm italic">
                    Calculated at checkout by Stripe
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Discount</label>
                  <input
                    type="number"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Discount Reason</label>
                  <input
                    type="text"
                    value={discountDescription}
                    onChange={(e) => setDiscountDescription(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Loyalty discount"
                  />
                </div>
              </div>

              {/* Payment Plan */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Down Payment %</label>
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(parseInt(e.target.value) || 25)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="10"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Num Payments</label>
                  <input
                    type="number"
                    value={numPayments}
                    onChange={(e) => setNumPayments(parseInt(e.target.value) || 4)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="2"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Frequency</label>
                  <select
                    value={paymentFrequency}
                    onChange={(e) => setPaymentFrequency(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Valid For (days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 14)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    min="1"
                    max="90"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Customer Notes (visible to customer)</label>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Admin Notes (internal only)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-900 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-gray-400 text-sm">Subtotal</div>
                    <div className="text-white text-lg font-semibold">{formatCurrency(calculateSubtotal())}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Total</div>
                    <div className="text-green-400 text-lg font-semibold">{formatCurrency(calculateTotal())}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Down Payment</div>
                    <div className="text-blue-400 text-lg font-semibold">{formatCurrency(calculateDownPayment())}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">{numPayments} Payments of</div>
                    <div className="text-white text-lg font-semibold">{formatCurrency(calculatePaymentAmount())}</div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Quote"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quotes Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="text-left p-4 text-gray-300 font-semibold">Quote #</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Customer</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Total</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Valid Until</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No quotes found</td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-4 text-white font-mono text-sm">{quote.quote_number}</td>
                    <td className="p-4">
                      <div className="text-white">{quote.customer_name}</div>
                      <div className="text-gray-400 text-sm">{quote.customer_email}</div>
                    </td>
                    <td className="p-4 text-white font-semibold">{formatCurrency(quote.total_amount)}</td>
                    <td className="p-4">{getStatusBadge(quote.status)}</td>
                    <td className="p-4 text-gray-300">{formatDate(quote.valid_until)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyQuoteUrl(quote.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          title="Copy quote URL"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                        >
                          View
                        </button>
                        {quote.status === "pending" && (
                          <button
                            onClick={() => handleCancelQuote(quote.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quote Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedQuote.quote_number}</h3>
                  <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Customer</div>
                    <div className="text-white">{selectedQuote.customer_name}</div>
                    <div className="text-gray-400 text-sm">{selectedQuote.customer_email}</div>
                    {selectedQuote.customer_phone && (
                      <div className="text-gray-400 text-sm">{selectedQuote.customer_phone}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">Valid Until</div>
                    <div className="text-white">{formatDate(selectedQuote.valid_until)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-2">Items</div>
                  <div className="bg-gray-900 rounded p-3 space-y-2">
                    {selectedQuote.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white">
                          {item.quantity}x {item.name}
                          {item.description && <span className="text-gray-400 text-sm ml-2">({item.description})</span>}
                        </span>
                        <span className="text-white">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-900 rounded p-3">
                  <div>
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedQuote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Shipping</span>
                      <span>{formatCurrency(selectedQuote.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-sm italic">
                      <span>Tax</span>
                      <span>At checkout</span>
                    </div>
                    {selectedQuote.discount_amount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(selectedQuote.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold mt-2 pt-2 border-t border-gray-700">
                      <span>Total</span>
                      <span>{formatCurrency(selectedQuote.total_amount)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Payment Plan</div>
                    <div className="text-white">
                      {selectedQuote.suggested_down_payment_percent}% down ({formatCurrency(selectedQuote.suggested_down_payment_amount)})
                    </div>
                    <div className="text-white">
                      {selectedQuote.suggested_num_payments} {selectedQuote.suggested_payment_frequency} payments
                    </div>
                    <div className="text-white">
                      {formatCurrency(selectedQuote.suggested_payment_amount)} each
                    </div>
                  </div>
                </div>

                {selectedQuote.customer_notes && (
                  <div>
                    <div className="text-gray-400 text-sm">Customer Notes</div>
                    <div className="text-white bg-gray-900 p-2 rounded">{selectedQuote.customer_notes}</div>
                  </div>
                )}

                {selectedQuote.admin_notes && (
                  <div>
                    <div className="text-gray-400 text-sm">Admin Notes</div>
                    <div className="text-yellow-200 bg-gray-900 p-2 rounded">{selectedQuote.admin_notes}</div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => copyQuoteUrl(selectedQuote.id)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Copy Quote URL
                  </button>
                  <button
                    onClick={() => window.open(`/shop/layaway/quote/${selectedQuote.id}`, "_blank")}
                    className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                  >
                    Preview Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

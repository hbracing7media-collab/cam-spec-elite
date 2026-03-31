"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const verifySession = async () => {
    try {
      const res = await fetch(`/api/shop/stripe/verify-session?session_id=${sessionId}`);
      const data = await res.json();
      
      if (data.ok) {
        setOrderInfo(data.session);
        // Clear cart on successful purchase
        localStorage.removeItem("cart");
      } else {
        setError(data.message || "Could not verify payment");
      }
    } catch (err) {
      setError("Failed to verify payment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Payment Verification Issue</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <p className="text-gray-500 text-sm mb-6">
            If you were charged, please contact us with your payment confirmation.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        
        {orderInfo && (
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-gray-400 mb-2">
              <span>Amount Paid</span>
              <span className="text-white font-semibold">
                ${(orderInfo.amount_total / 100).toFixed(2)}
              </span>
            </div>
            {orderInfo.total_details?.amount_tax > 0 && (
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Includes Tax</span>
                <span>${(orderInfo.total_details.amount_tax / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 text-sm mt-2">
              <span>Email</span>
              <span>{orderInfo.customer_email}</span>
            </div>
          </div>
        )}

        <p className="text-gray-400 mb-6">
          Thank you for your purchase! A confirmation email has been sent to your email address.
        </p>

        <div className="space-y-3">
          {orderInfo?.metadata?.layaway_plan_id && (
            <Link
              href="/shop/layaway"
              className="block w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              View Layaway Plan
            </Link>
          )}
          
          <Link
            href="/shop"
            className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

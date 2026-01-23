"use client";

import Link from "next/link";
import Image from "next/image";

export default function LayawayInfoPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1e 0%, #1a1a2e 100%)",
        color: "#e2e8f0",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              background: "linear-gradient(90deg, #ff3bd4, #00f5ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 16,
            }}
          >
            💰 Layaway Payment Plans
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 600, margin: "0 auto" }}>
            Reserve your parts now and pay over time — no credit checks, no interest, no stress. Items ship when paid in full.
          </p>
        </div>

        {/* Hero Benefits */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 50,
          }}
        >
          {[
            { icon: "✅", title: "0% Interest", desc: "Never pay a penny more than the sticker price" },
            { icon: "🔒", title: "No Credit Check", desc: "Your credit score stays untouched" },
            { icon: "📅", title: "Flexible Schedule", desc: "Weekly, bi-weekly, or monthly payments" },
            { icon: "📦", title: "Ship When Paid", desc: "Items ship as soon as your plan is complete" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 59, 212, 0.2)",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#00f5ff", marginBottom: 8 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(0, 245, 255, 0.2)",
            borderRadius: 16,
            padding: 32,
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#ff3bd4", marginBottom: 24, textAlign: "center" }}>
            How It Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                step: 1,
                title: "Add Items to Cart",
                desc: "Shop for the parts or gear you want. Layaway is available on orders $100 and up.",
              },
              {
                step: 2,
                title: "Choose Layaway at Checkout",
                desc: 'Select "Payment Plans" as your payment method and configure your schedule.',
              },
              {
                step: 3,
                title: "Pay Your Down Payment",
                desc: "Put down 10-50% to start your plan. The more you put down, the smaller your payments.",
              },
              {
                step: 4,
                title: "Make Your Scheduled Payments",
                desc: "Pay weekly, bi-weekly, or monthly — whatever works for your budget. We'll send reminders!",
              },
              {
                step: 5,
                title: "We Ship When You're Paid Off",
                desc: "Once your final payment clears, we ship your order. No surprises, no hidden fees.",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff3bd4, #00f5ff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 16,
                    color: "#0a0a1e",
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 14, color: "#94a3b8" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Example */}
        <div
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: 16,
            padding: 32,
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#22c55e", marginBottom: 20, textAlign: "center" }}>
            💡 Example Payment Plan
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Order Total</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0" }}>$400</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Down Payment (25%)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ff3bd4" }}>$100</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>4 Bi-Weekly Payments</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00f5ff" }}>$75 each</div>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "#94a3b8" }}>Total Paid</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>$400</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#94a3b8" }}>
            Same price as paying upfront — just spread over ~8 weeks!
          </div>
        </div>

        {/* Terms & Policies */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: 32,
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 20 }}>
            Terms & Policies
          </h2>
          <ul style={{ paddingLeft: 24, lineHeight: 2, color: "#94a3b8" }}>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Minimum Order:</strong> $100 to qualify for layaway.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Down Payment:</strong> 10% to 50% of your order total (configurable at checkout).
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Payment Frequency:</strong> Weekly, bi-weekly, or monthly — your choice.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Number of Payments:</strong> 2 to 12 installments after your down payment.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Grace Period:</strong> 7 days after a due date before a late fee applies.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Late Fee:</strong> $5 per missed payment after the grace period.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Cancellation:</strong> You may cancel at any time. A 10% restocking fee applies; the remainder is refunded.
            </li>
            <li>
              <strong style={{ color: "#e2e8f0" }}>Item Availability:</strong> Items are held for you while your plan is active. We don't sell them to anyone else.
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div
          style={{
            background: "rgba(255, 59, 212, 0.05)",
            border: "1px solid rgba(255, 59, 212, 0.2)",
            borderRadius: 16,
            padding: 32,
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#ff3bd4", marginBottom: 24 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                q: "Is there a credit check?",
                a: "No. Our internal layaway system does not check or affect your credit score.",
              },
              {
                q: "When do you ship my order?",
                a: "We ship as soon as your final payment is confirmed. Standard shipping times apply from that point.",
              },
              {
                q: "Can I pay off my plan early?",
                a: "Absolutely! You can make extra payments or pay off the remaining balance at any time — no penalties.",
              },
              {
                q: "What if I miss a payment?",
                a: "You have a 7-day grace period. After that, a $5 late fee is added. If payments are missed repeatedly, the plan may be cancelled and a restocking fee deducted from your refund.",
              },
              {
                q: "Can I add more items to my layaway plan?",
                a: "Currently, each layaway plan is fixed at checkout. To add more items, you'd start a new plan.",
              },
              {
                q: "Do you offer Affirm or other BNPL options?",
                a: "Yes! At checkout, you may also see options like Affirm (subject to approval). These are handled directly by the provider and may have different terms.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                  Q: {faq.q}
                </div>
                <div style={{ fontSize: 14, color: "#94a3b8", paddingLeft: 16 }}>A: {faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link
            href="/shop"
            style={{
              display: "inline-block",
              padding: "16px 40px",
              background: "linear-gradient(90deg, #ff3bd4, #00f5ff)",
              color: "#0a0a1e",
              fontWeight: 800,
              fontSize: 18,
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(255, 59, 212, 0.4)",
            }}
          >
            Start Shopping →
          </Link>
          <div style={{ marginTop: 16 }}>
            <Link
              href="/shop/layaway"
              style={{
                color: "#00f5ff",
                textDecoration: "underline",
                fontSize: 14,
              }}
            >
              Already have a layaway plan? View your dashboard →
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center" }}>
          <Link href="/shop" style={{ color: "#94a3b8", fontSize: 14 }}>
            ← Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

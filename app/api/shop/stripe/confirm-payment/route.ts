import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// POST - Confirm payment was successful and update database
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payment_intent_id, plan_id, payment_id } = body;
    
    if (!payment_intent_id) {
      return NextResponse.json(
        { ok: false, message: "Payment intent ID is required" },
        { status: 400 }
      );
    }
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({
        ok: false,
        message: `Payment not complete. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }
    
    // Get plan and payment IDs from metadata if not provided
    const layawayPlanId = plan_id || paymentIntent.metadata.layaway_plan_id;
    const layawayPaymentId = payment_id || paymentIntent.metadata.layaway_payment_id;
    
    if (!layawayPlanId || !layawayPaymentId) {
      return NextResponse.json(
        { ok: false, message: "Missing layaway plan or payment ID" },
        { status: 400 }
      );
    }
    
    // Update the layaway payment record
    const { error: updateError } = await supabase
      .from("layaway_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "card",
        transaction_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", layawayPaymentId)
      .eq("plan_id", layawayPlanId);
    
    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      // Don't fail the request - payment was successful, we can reconcile later
    }
    
    // Get updated plan info
    const { data: plan } = await supabase
      .from("layaway_plans")
      .select("*, layaway_payments(*)")
      .eq("id", layawayPlanId)
      .single();
    
    // Check if plan is complete
    const isComplete = plan?.status === "completed";
    
    return NextResponse.json({
      ok: true,
      message: isComplete 
        ? "🎉 Congratulations! Your layaway is paid in full!"
        : "Payment successful!",
      payment: {
        id: layawayPaymentId,
        stripe_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: "paid",
      },
      plan: plan ? {
        id: plan.id,
        plan_number: plan.plan_number,
        status: plan.status,
        amount_paid: plan.amount_paid,
        remaining_balance: plan.remaining_balance,
        next_payment_due: plan.next_payment_due,
      } : null,
    });
    
  } catch (err) {
    console.error("Confirm payment error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

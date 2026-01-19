import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Supabase admin client lazily to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful payment - update layaway payment record
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  const { layaway_payment_id, layaway_plan_id } = paymentIntent.metadata || {};

  if (!layaway_payment_id) {
    console.log("Not a layaway payment, skipping");
    return;
  }

  // Update the layaway payment record
  const { error } = await getSupabase()
    .from("layaway_payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      transaction_id: paymentIntent.id,
      payment_method: paymentIntent.payment_method_types?.[0] || "card",
      updated_at: new Date().toISOString(),
    })
    .eq("id", layaway_payment_id);

  if (error) {
    console.error("Failed to update layaway payment:", error);
    throw error;
  }

  console.log(`Layaway payment ${layaway_payment_id} marked as paid`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  const { layaway_payment_id } = paymentIntent.metadata || {};

  if (!layaway_payment_id) {
    console.log("Not a layaway payment, skipping");
    return;
  }

  // Update the layaway payment record
  const { error } = await getSupabase()
    .from("layaway_payments")
    .update({
      autopay_failed: true,
      failure_reason: paymentIntent.last_payment_error?.message || "Payment failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", layaway_payment_id);

  if (error) {
    console.error("Failed to update layaway payment:", error);
    throw error;
  }

  console.log(`Layaway payment ${layaway_payment_id} marked as failed`);
}

/**
 * Handle completed checkout session (for down payments via Checkout)
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}`);

  const { layaway_plan_id, layaway_payment_id } = session.metadata || {};

  if (!layaway_plan_id) {
    console.log("Not a layaway checkout, skipping");
    return;
  }

  // If there's a payment ID, mark it paid
  if (layaway_payment_id) {
    const { error } = await getSupabase()
      .from("layaway_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        transaction_id: session.payment_intent as string,
        payment_method: session.payment_method_types?.[0] || "card",
        updated_at: new Date().toISOString(),
      })
      .eq("id", layaway_payment_id);

    if (error) {
      console.error("Failed to update layaway payment from checkout:", error);
      throw error;
    }
  }

  console.log(`Layaway plan ${layaway_plan_id} checkout completed`);
}

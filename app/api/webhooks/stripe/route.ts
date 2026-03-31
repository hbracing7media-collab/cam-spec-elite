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
 * Handle completed checkout session (for down payments via Checkout and regular shop orders)
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}`);

  const { layaway_plan_id, layaway_payment_id, order_type } = session.metadata || {};
  const supabase = getSupabase();

  // Handle regular shop orders
  if (order_type === "shop_purchase" || !layaway_plan_id) {
    console.log("Processing regular shop order");
    
    try {
      // Get shipping address from collected details (available when shipping_address_collection is enabled)
      const shippingAddr = (session as any).shipping_details?.address || 
                          (session as any).customer_details?.address;
      
      // Send order notification to admin
      const notifyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/shop/checkout/notify-stripe-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: session.payment_intent as string,
          checkoutSessionId: session.id,
          customerName: session.customer_details?.name || "Unknown",
          customerEmail: session.customer_email || session.customer_details?.email || "Unknown",
          customerPhone: session.customer_details?.phone || session.metadata?.customer_phone || "",
          subtotal: (session.amount_subtotal || 0) / 100,
          shipping: 0, // Shipping is in line items
          tax: (session.total_details?.amount_tax || 0) / 100,
          taxRate: 0, // Calculated dynamically by Stripe
          total: (session.amount_total || 0) / 100,
          shippingAddress: shippingAddr ? {
            address: shippingAddr.line1,
            city: shippingAddr.city,
            state: shippingAddr.state,
            zip: shippingAddr.postal_code,
          } : null,
          taxCalculatedByStripe: true,
          stripeCheckoutSession: true,
        }),
      });
      
      if (!notifyResponse.ok) {
        console.error("Failed to send order notification:", await notifyResponse.text());
      } else {
        console.log("Order notification sent successfully");
      }
    } catch (err) {
      console.error("Error sending order notification:", err);
      // Don't throw - order was successful, just notification failed
    }
    
    // If not a layaway order, we're done
    if (!layaway_plan_id) {
      return;
    }
  }

  // If there's a payment ID, mark it paid
  if (layaway_payment_id) {
    const { error } = await supabase
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
    
    // Check if this was the down payment (payment_number = 0) and if so, activate the plan
    const { data: payment } = await supabase
      .from("layaway_payments")
      .select("payment_number, amount")
      .eq("id", layaway_payment_id)
      .single();
    
    if (payment?.payment_number === 0) {
      // This was the down payment - update plan status to active
      const { error: planError } = await supabase
        .from("layaway_plans")
        .update({
          status: "active",
          amount_paid: payment.amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", layaway_plan_id);
      
      if (planError) {
        console.error("Failed to activate layaway plan:", planError);
      } else {
        console.log(`Layaway plan ${layaway_plan_id} activated after down payment`);
        
        // Calculate next payment due date
        const { data: plan } = await supabase
          .from("layaway_plans")
          .select("payment_frequency")
          .eq("id", layaway_plan_id)
          .single();
        
        if (plan) {
          const nextDue = new Date();
          switch (plan.payment_frequency) {
            case "weekly": nextDue.setDate(nextDue.getDate() + 7); break;
            case "biweekly": nextDue.setDate(nextDue.getDate() + 14); break;
            case "monthly": nextDue.setMonth(nextDue.getMonth() + 1); break;
          }
          
          await supabase
            .from("layaway_plans")
            .update({ next_payment_due: nextDue.toISOString().split("T")[0] })
            .eq("id", layaway_plan_id);
        }
      }
    }
  }

  console.log(`Layaway plan ${layaway_plan_id} checkout completed`);
}

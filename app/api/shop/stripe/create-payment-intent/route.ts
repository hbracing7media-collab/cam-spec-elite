import { NextRequest, NextResponse } from "next/server";
import { stripe, toStripeCents } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface CreatePaymentIntentRequest {
  plan_id: string;
  payment_id: string;
  amount: number;
  customer_email: string;
  customer_name: string;
  description?: string;
  save_card?: boolean;  // For future auto-payments
}

// ============================================
// POST - Create Payment Intent for Layaway Payment
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: CreatePaymentIntentRequest = await req.json();
    
    // Validate required fields
    if (!body.plan_id || !body.payment_id || !body.amount) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get the layaway plan to verify
    const { data: plan, error: planError } = await supabase
      .from("layaway_plans")
      .select("*")
      .eq("id", body.plan_id)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json(
        { ok: false, message: "Layaway plan not found" },
        { status: 404 }
      );
    }
    
    // Get the specific payment
    const { data: payment, error: paymentError } = await supabase
      .from("layaway_payments")
      .select("*")
      .eq("id", body.payment_id)
      .eq("plan_id", body.plan_id)
      .single();
    
    if (paymentError || !payment) {
      return NextResponse.json(
        { ok: false, message: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Check payment hasn't already been processed
    if (payment.status === "paid") {
      return NextResponse.json(
        { ok: false, message: "This payment has already been processed" },
        { status: 400 }
      );
    }
    
    // Find or create Stripe customer
    let customerId: string;
    
    const existingCustomers = await stripe.customers.list({
      email: body.customer_email,
      limit: 1,
    });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: body.customer_email,
        name: body.customer_name,
        metadata: {
          layaway_plan_id: body.plan_id,
        },
      });
      customerId = customer.id;
    }
    
    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeCents(body.amount),
      currency: "usd",
      customer: customerId,
      description: body.description || `Layaway Payment - ${plan.plan_number}`,
      metadata: {
        layaway_plan_id: body.plan_id,
        layaway_payment_id: body.payment_id,
        plan_number: plan.plan_number,
        payment_number: payment.payment_number.toString(),
      },
      // Enable saving payment method for future use
      setup_future_usage: body.save_card ? "off_session" : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
    });
    
  } catch (err) {
    console.error("Create payment intent error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

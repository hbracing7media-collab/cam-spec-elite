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
  // Shipping address for tax calculation
  shipping?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
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
      // Update existing customer with address if provided
      if (body.shipping) {
        const customer = await stripe.customers.update(existingCustomers.data[0].id, {
          name: body.customer_name,
          address: {
            line1: body.shipping.address,
            city: body.shipping.city,
            state: body.shipping.state,
            postal_code: body.shipping.zip,
            country: "US",
          },
          shipping: {
            name: body.customer_name,
            address: {
              line1: body.shipping.address,
              city: body.shipping.city,
              state: body.shipping.state,
              postal_code: body.shipping.zip,
              country: "US",
            },
          },
        });
        customerId = customer.id;
      } else {
        customerId = existingCustomers.data[0].id;
      }
    } else {
      const customerData: any = {
        email: body.customer_email,
        name: body.customer_name,
        metadata: {
          layaway_plan_id: body.plan_id,
        },
      };
      
      if (body.shipping) {
        customerData.address = {
          line1: body.shipping.address,
          city: body.shipping.city,
          state: body.shipping.state,
          postal_code: body.shipping.zip,
          country: "US",
        };
        customerData.shipping = {
          name: body.customer_name,
          address: {
            line1: body.shipping.address,
            city: body.shipping.city,
            state: body.shipping.state,
            postal_code: body.shipping.zip,
            country: "US",
          },
        };
      }
      
      const customer = await stripe.customers.create(customerData);
      customerId = customer.id;
    }
    
    // Calculate tax using Stripe Tax if shipping address provided
    let taxAmountCents = 0;
    let taxCalculationId: string | undefined;
    const paymentAmountCents = toStripeCents(body.amount);
    
    if (body.shipping) {
      try {
        const taxCalculation = await stripe.tax.calculations.create({
          currency: "usd",
          customer: customerId,
          line_items: [
            {
              amount: paymentAmountCents,
              reference: "layaway_payment",
              tax_code: "txcd_20030000", // General - Services
            },
          ],
          shipping_cost: {
            amount: 0,
          },
        });
        
        taxAmountCents = taxCalculation.tax_amount_exclusive;
        taxCalculationId = taxCalculation.id;
        console.log(`Stripe Tax calculated: $${(taxAmountCents / 100).toFixed(2)} for ${body.shipping.state}`);
      } catch (taxError) {
        console.error("Stripe Tax calculation error:", taxError);
        // If Stripe Tax fails, proceed without tax
      }
    }
    
    const totalAmountCents = paymentAmountCents + taxAmountCents;
    
    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: "usd",
      customer: customerId,
      description: body.description || `Layaway Payment - ${plan.plan_number}`,
      metadata: {
        layaway_plan_id: body.plan_id,
        layaway_payment_id: body.payment_id,
        plan_number: plan.plan_number,
        payment_number: payment.payment_number.toString(),
        tax_amount_cents: taxAmountCents.toString(),
        tax_calculation_id: taxCalculationId || "",
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
      taxAmount: taxAmountCents / 100,
      totalAmount: totalAmountCents / 100,
    });
    
  } catch (err) {
    console.error("Create payment intent error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

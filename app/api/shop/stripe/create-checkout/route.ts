import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  price: number; // In dollars
  image?: string;
}

interface CreateCheckoutRequest {
  // For regular checkout
  items?: LineItem[];
  shipping_cost?: number;
  
  // For layaway payments
  layaway?: {
    plan_id: string;
    payment_id: string;
    description: string;
  };
  amount?: number; // For layaway, amount in dollars
  
  // Customer info
  customer_email: string;
  customer_name: string;
  
  // URLs
  success_url?: string;
  cancel_url?: string;
  
  // Metadata
  metadata?: Record<string, string>;
}

// ============================================
// POST - Create Stripe Checkout Session with automatic tax
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await req.json();
    
    // Validate
    if (!body.customer_email) {
      return NextResponse.json(
        { ok: false, message: "Customer email is required" },
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
      // Update name if provided
      if (body.customer_name) {
        await stripe.customers.update(customerId, {
          name: body.customer_name,
        });
      }
    } else {
      const customer = await stripe.customers.create({
        email: body.customer_email,
        name: body.customer_name,
      });
      customerId = customer.id;
    }
    
    // Build line items for Stripe Checkout
    let lineItems: any[] = [];
    let metadata: Record<string, string> = body.metadata || {};
    
    if (body.layaway) {
      // Layaway payment - single line item
      if (!body.amount) {
        return NextResponse.json(
          { ok: false, message: "Amount required for layaway payment" },
          { status: 400 }
        );
      }
      
      // Verify the layaway plan and payment exist
      const { data: plan, error: planError } = await supabase
        .from("layaway_plans")
        .select("*")
        .eq("id", body.layaway.plan_id)
        .single();
      
      if (planError || !plan) {
        return NextResponse.json(
          { ok: false, message: "Layaway plan not found" },
          { status: 404 }
        );
      }
      
      const { data: payment, error: paymentError } = await supabase
        .from("layaway_payments")
        .select("*")
        .eq("id", body.layaway.payment_id)
        .eq("plan_id", body.layaway.plan_id)
        .single();
      
      if (paymentError || !payment) {
        return NextResponse.json(
          { ok: false, message: "Payment not found" },
          { status: 404 }
        );
      }
      
      if (payment.status === "paid") {
        return NextResponse.json(
          { ok: false, message: "This payment has already been processed" },
          { status: 400 }
        );
      }
      
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: body.layaway.description || `Layaway Payment - ${plan.plan_number}`,
            description: `Payment ${payment.payment_number === 0 ? "(Down Payment)" : `#${payment.payment_number}`}`,
          },
          unit_amount: Math.round(body.amount * 100), // Convert to cents
        },
        quantity: 1,
      }];
      
      metadata = {
        ...metadata,
        layaway_plan_id: body.layaway.plan_id,
        layaway_payment_id: body.layaway.payment_id,
        plan_number: plan.plan_number,
        payment_number: payment.payment_number.toString(),
      };
      
    } else if (body.items && body.items.length > 0) {
      // Regular checkout with items
      lineItems = body.items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.description,
            images: item.image ? [item.image] : undefined,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));
      
      // Add shipping as a line item if specified
      if (body.shipping_cost && body.shipping_cost > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Shipping",
              description: "Standard shipping",
            },
            unit_amount: Math.round(body.shipping_cost * 100),
          },
          quantity: 1,
        });
      }
    } else {
      return NextResponse.json(
        { ok: false, message: "Either items or layaway payment required" },
        { status: 400 }
      );
    }
    
    // Get the base URL for success/cancel redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000";
    
    // Create Checkout Session with automatic tax
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        address: "auto",
        shipping: "auto",
      },
      mode: "payment",
      line_items: lineItems,
      
      // Enable automatic tax calculation
      automatic_tax: {
        enabled: true,
      },
      
      // Collect shipping address for tax calculation
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      
      // Billing address needed for tax
      billing_address_collection: "required",
      
      // URLs
      success_url: body.success_url || `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancel_url || `${baseUrl}/shop/checkout?cancelled=true`,
      
      // Store metadata
      metadata,
      
      // Customer email prefilled
      customer_email: undefined, // Don't set if we have customer ID
      
      // Payment method types
      payment_method_types: ["card"],
      
      // Save payment method for future use
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata,
      },
    });
    
    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
    });
    
  } catch (err) {
    console.error("Create checkout session error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}

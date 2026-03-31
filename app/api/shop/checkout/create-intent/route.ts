import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

interface ShippingAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}

interface LineItem {
  name: string;
  quantity: number;
  price: number; // In dollars
}

interface CheckoutPaymentRequest {
  amount: number; // In cents - TOTAL amount (already including tax if pre-calculated)
  customerEmail: string;
  customerName: string;
  shippingAddress?: ShippingAddress; // If provided, will calculate Stripe Tax on top
  lineItems?: LineItem[];
  metadata?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPaymentRequest = await req.json();
    
    // Validate required fields
    if (!body.amount || !body.customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields (amount, customerEmail)" },
        { status: 400 }
      );
    }

    // Ensure amount is at least $0.50 (Stripe minimum)
    if (body.amount < 50) {
      return NextResponse.json(
        { error: "Amount must be at least $0.50" },
        { status: 400 }
      );
    }

    let customerId: string | undefined;
    
    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: body.customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Update name if provided
      if (body.customerName) {
        await stripe.customers.update(customerId, {
          name: body.customerName,
        });
      }
    } else {
      const customer = await stripe.customers.create({
        email: body.customerEmail,
        name: body.customerName,
      });
      customerId = customer.id;
    }

    // Create payment intent with the amount provided (tax already included)
    const paymentIntentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: body.amount, // Amount in cents - already includes tax
      currency: "usd",
      customer: customerId,
      receipt_email: body.customerEmail,
      metadata: {
        customer_name: body.customerName || "",
        tax_calculated_in_app: "true",
        ...body.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount: body.amount / 100, // Total in dollars
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

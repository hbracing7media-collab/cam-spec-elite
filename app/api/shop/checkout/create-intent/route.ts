import { NextRequest, NextResponse } from "next/server";
import { stripe, toStripeCents } from "@/lib/stripe";

interface CheckoutPaymentRequest {
  amount: number; // In cents
  customerEmail: string;
  customerName: string;
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount,
      currency: "usd",
      receipt_email: body.customerEmail,
      metadata: {
        customer_name: body.customerName || "",
        ...body.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

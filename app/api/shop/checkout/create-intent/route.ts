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
  amount: number; // In cents (subtotal + shipping, NOT including tax)
  customerEmail: string;
  customerName: string;
  shippingAddress?: ShippingAddress;
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
    let taxAmountCents = 0;
    let taxCalculationId: string | undefined;
    
    // If we have a shipping address, calculate tax using Stripe Tax
    if (body.shippingAddress) {
      // Find or create Stripe customer with address
      const existingCustomers = await stripe.customers.list({
        email: body.customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Update existing customer with current address
        const customer = await stripe.customers.update(existingCustomers.data[0].id, {
          name: body.customerName,
          address: {
            line1: body.shippingAddress.line1,
            city: body.shippingAddress.city,
            state: body.shippingAddress.state,
            postal_code: body.shippingAddress.postal_code,
            country: body.shippingAddress.country || "US",
          },
          shipping: {
            name: body.customerName,
            address: {
              line1: body.shippingAddress.line1,
              city: body.shippingAddress.city,
              state: body.shippingAddress.state,
              postal_code: body.shippingAddress.postal_code,
              country: body.shippingAddress.country || "US",
            },
          },
        });
        customerId = customer.id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: body.customerEmail,
          name: body.customerName,
          address: {
            line1: body.shippingAddress.line1,
            city: body.shippingAddress.city,
            state: body.shippingAddress.state,
            postal_code: body.shippingAddress.postal_code,
            country: body.shippingAddress.country || "US",
          },
          shipping: {
            name: body.customerName,
            address: {
              line1: body.shippingAddress.line1,
              city: body.shippingAddress.city,
              state: body.shippingAddress.state,
              postal_code: body.shippingAddress.postal_code,
              country: body.shippingAddress.country || "US",
            },
          },
        });
        customerId = customer.id;
      }

      // Calculate tax using Stripe Tax Calculations API
      try {
        const taxCalculation = await stripe.tax.calculations.create({
          currency: "usd",
          customer: customerId,
          line_items: [
            {
              amount: body.amount,
              reference: "order_subtotal_and_shipping",
              // Use services tax code for future machine shop/consulting services
              // For goods, use txcd_99999999 (General - Tangible Goods)
              tax_code: "txcd_20030000", // General - Services
            },
          ],
          shipping_cost: {
            amount: 0, // Shipping already included in amount
          },
        });
        
        taxAmountCents = taxCalculation.tax_amount_exclusive;
        taxCalculationId = taxCalculation.id;
      } catch (taxError) {
        console.error("Tax calculation error (proceeding without tax):", taxError);
        // Continue without tax if calculation fails (e.g., no registration for state)
      }
    }

    // Total amount = original amount + calculated tax
    const totalAmountCents = body.amount + taxAmountCents;

    // Create payment intent with the total including tax
    const paymentIntentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: totalAmountCents,
      currency: "usd",
      receipt_email: body.customerEmail,
      metadata: {
        customer_name: body.customerName || "",
        tax_amount_cents: taxAmountCents.toString(),
        tax_calculation_id: taxCalculationId || "",
        amount_before_tax_cents: body.amount.toString(),
        ...body.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add customer if available
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount: totalAmountCents / 100, // Total in dollars including tax
      taxAmount: taxAmountCents / 100, // Tax in dollars
      amountBeforeTax: body.amount / 100, // Original amount in dollars
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

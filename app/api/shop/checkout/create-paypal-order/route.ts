import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || "Failed to get PayPal access token");
  }

  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, items, shipping } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: items.reduce((sum: number, item: { price: number; quantity: number }) => 
                    sum + (item.price * item.quantity), 0
                  ).toFixed(2),
                },
                shipping: {
                  currency_code: "USD",
                  value: "5.99",
                },
                tax_total: {
                  currency_code: "USD",
                  value: (amount - items.reduce((sum: number, item: { price: number; quantity: number }) => 
                    sum + (item.price * item.quantity), 0
                  ) - 5.99).toFixed(2),
                },
              },
            },
            items: items.map((item: { name: string; price: number; quantity: number }) => ({
              name: item.name,
              unit_amount: {
                currency_code: "USD",
                value: item.price.toFixed(2),
              },
              quantity: String(item.quantity),
            })),
            shipping: shipping ? {
              name: {
                full_name: shipping.name,
              },
              address: {
                address_line_1: shipping.address,
                admin_area_2: shipping.city,
                admin_area_1: shipping.state,
                postal_code: shipping.zip,
                country_code: "US",
              },
            } : undefined,
          },
        ],
        application_context: {
          brand_name: "HB Racing",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/shop/checkout?paypal=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/shop/checkout?paypal=cancel`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal order creation failed:", orderData);
      return NextResponse.json(
        { ok: false, message: orderData.message || "Failed to create PayPal order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderID: orderData.id,
    });
  } catch (error) {
    console.error("PayPal order error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "PayPal order failed" },
      { status: 500 }
    );
  }
}

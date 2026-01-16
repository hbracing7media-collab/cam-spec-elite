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
    const { orderID } = body;

    if (!orderID) {
      return NextResponse.json(
        { ok: false, message: "Missing order ID" },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("PayPal capture failed:", captureData);
      return NextResponse.json(
        { ok: false, message: captureData.message || "Failed to capture PayPal payment" },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (captureData.status === "COMPLETED") {
      // Here you could:
      // 1. Save order to database
      // 2. Send confirmation email
      // 3. Update inventory
      // etc.

      const payment = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      
      console.log("PayPal payment captured successfully:", {
        orderID,
        transactionID: payment?.id,
        amount: payment?.amount?.value,
        status: captureData.status,
      });

      return NextResponse.json({
        ok: true,
        message: "Payment successful",
        transactionID: payment?.id,
        orderID: captureData.id,
      });
    } else {
      return NextResponse.json(
        { ok: false, message: `Payment status: ${captureData.status}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "PayPal capture failed" },
      { status: 500 }
    );
  }
}

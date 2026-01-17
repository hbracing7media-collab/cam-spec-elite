import { NextRequest, NextResponse } from "next/server";
import { notifyNewOrder } from "@/lib/email";

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
      const payment = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      const purchaseUnit = captureData.purchase_units?.[0];
      const shipping = purchaseUnit?.shipping;
      const payer = captureData.payer;
      
      // Send notification email to company
      try {
        await notifyNewOrder({
          orderNumber: captureData.id,
          customerName: shipping?.name?.full_name || payer?.name?.given_name + " " + payer?.name?.surname || "Customer",
          customerEmail: payer?.email_address || "",
          items: purchaseUnit?.items?.map((item: { name: string; quantity: string; unit_amount: { value: string } }) => ({
            name: item.name,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.unit_amount?.value) || 0,
          })) || [],
          subtotal: parseFloat(purchaseUnit?.amount?.breakdown?.item_total?.value) || 0,
          shipping: parseFloat(purchaseUnit?.amount?.breakdown?.shipping?.value) || 5.99,
          tax: parseFloat(purchaseUnit?.amount?.breakdown?.tax_total?.value) || 0,
          total: parseFloat(payment?.amount?.value) || 0,
          shippingAddress: {
            address: shipping?.address?.address_line_1 || "",
            city: shipping?.address?.admin_area_2 || "",
            state: shipping?.address?.admin_area_1 || "",
            zip: shipping?.address?.postal_code || "",
          },
          paymentMethod: "paypal",
        });
      } catch (emailErr) {
        console.error("Failed to send order notification email:", emailErr);
        // Don't fail the order if email fails
      }

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

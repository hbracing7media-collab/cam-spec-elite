import { NextRequest, NextResponse } from "next/server";
import { notifyNewOrder } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      paymentIntentId,
      customerName,
      customerEmail,
      items,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress 
    } = body;

    if (!paymentIntentId || !customerEmail) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate order number from payment intent
    const orderNumber = `HBR-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${paymentIntentId.slice(-8).toUpperCase()}`;

    // Send notification email
    await notifyNewOrder({
      orderNumber,
      customerName: customerName || "Customer",
      customerEmail,
      items: items || [],
      subtotal: subtotal || 0,
      shipping: shipping || 5.99,
      tax: tax || 0,
      total: total || 0,
      shippingAddress: shippingAddress || {
        address: "",
        city: "",
        state: "",
        zip: "",
      },
      paymentMethod: "card",
    });

    return NextResponse.json({
      ok: true,
      orderNumber,
      message: "Order notification sent",
    });
  } catch (error) {
    console.error("Stripe notification error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to send notification" },
      { status: 500 }
    );
  }
}

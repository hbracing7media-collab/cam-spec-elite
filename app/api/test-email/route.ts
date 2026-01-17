import { NextResponse } from "next/server";
import { notifyNewOrder } from "@/lib/email";

export async function GET() {
  const testOrder = {
    orderNumber: "TEST-" + Date.now(),
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    items: [
      { name: "HB Racing T-Shirt", quantity: 1, price: 29.99, size: "L" },
      { name: "Racing Sticker Pack", quantity: 2, price: 9.99 },
    ],
    subtotal: 49.97,
    shipping: 5.99,
    tax: 4.12,
    total: 60.08,
    shippingAddress: {
      address: "123 Test Street",
      city: "Houston",
      state: "TX",
      zip: "77001",
    },
    paymentMethod: "paypal" as const,
  };

  const success = await notifyNewOrder(testOrder);

  if (success) {
    return NextResponse.json({ 
      ok: true, 
      message: "Test email sent to hbracing77@yahoo.com" 
    });
  } else {
    return NextResponse.json({ 
      ok: false, 
      message: "Failed to send email - check RESEND_API_KEY in Vercel" 
    }, { status: 500 });
  }
}

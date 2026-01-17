import { NextRequest, NextResponse } from "next/server";
import { notifyNewOrder } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      paymentIntentId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      shipping,
      tax,
      taxRate,
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

    // Save order to database
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });

      const { error: dbError } = await supabase
        .from("shop_orders")
        .insert({
          order_number: orderNumber,
          customer_name: customerName || "Customer",
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          shipping_address: shippingAddress?.address || "",
          shipping_city: shippingAddress?.city || "",
          shipping_state: shippingAddress?.state || "",
          shipping_zip: shippingAddress?.zip || "",
          shipping_country: "USA",
          items: items || [],
          subtotal: subtotal || 0,
          shipping_cost: shipping || 5.99,
          tax_amount: tax || 0,
          tax_rate: taxRate || 0,
          total: total || 0,
          payment_method: "stripe",
          payment_id: paymentIntentId,
          status: "paid",
        });

      if (dbError) {
        console.error("Error saving order to database:", dbError);
        // Continue to send email even if DB fails
      } else {
        console.log("Order saved to database:", orderNumber);
      }
    }

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
      message: "Order saved and notification sent",
    });
  } catch (error) {
    console.error("Stripe notification error:", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to process order" },
      { status: 500 }
    );
  }
}

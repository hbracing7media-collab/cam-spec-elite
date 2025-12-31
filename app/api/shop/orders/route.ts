import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface OrderItem {
  id: string;
  name: string;
  size?: string;
  quantity: number;
  price: number;
}

interface OrderRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  items: OrderItem[];
  notes?: string;
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HBR-${dateStr}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();
    
    // Validate required fields
    if (!body.customer?.name || !body.customer?.email) {
      return NextResponse.json(
        { ok: false, message: "Name and email are required" },
        { status: 400 }
      );
    }
    
    if (!body.shipping?.address || !body.shipping?.city || !body.shipping?.state || !body.shipping?.zip) {
      return NextResponse.json(
        { ok: false, message: "Complete shipping address is required" },
        { status: 400 }
      );
    }
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Cart is empty" },
        { status: 400 }
      );
    }
    
    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 5.99; // Flat rate shipping
    const total = subtotal + shippingCost;
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Create order in database
    const { data: order, error } = await supabase
      .from("shop_orders")
      .insert({
        order_number: orderNumber,
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone || null,
        shipping_address: body.shipping.address,
        shipping_city: body.shipping.city,
        shipping_state: body.shipping.state,
        shipping_zip: body.shipping.zip,
        shipping_country: body.shipping.country || "USA",
        items: body.items,
        subtotal,
        shipping_cost: shippingCost,
        total,
        customer_notes: body.notes || null,
        status: "pending",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating order:", error);
      return NextResponse.json(
        { ok: false, message: "Failed to create order" },
        { status: 500 }
      );
    }
    
    // Generate PayPal payment URL
    // Using PayPal.me with amount - user can pay directly
    const paypalUrl = `https://paypal.me/HBRacing7/${total.toFixed(2)}USD`;
    
    // Alternative: Generate a more detailed PayPal button URL
    // This creates a PayPal checkout with item details
    const itemSummary = body.items
      .map(item => `${item.name}${item.size ? ` (${item.size})` : ""} x${item.quantity}`)
      .join(", ");
    
    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: total,
        subtotal: subtotal,
        shipping: shippingCost,
      },
      paypalUrl,
      message: `Order ${orderNumber} created! Please complete payment via PayPal.`,
      itemSummary,
    });
    
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error processing order" },
      { status: 500 }
    );
  }
}

// GET endpoint to check order status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order");
  
  if (!orderNumber) {
    return NextResponse.json(
      { ok: false, message: "Order number required" },
      { status: 400 }
    );
  }
  
  const { data: order, error } = await supabase
    .from("shop_orders")
    .select("order_number, status, total, created_at, items")
    .eq("order_number", orderNumber)
    .single();
  
  if (error || !order) {
    return NextResponse.json(
      { ok: false, message: "Order not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ ok: true, order });
}

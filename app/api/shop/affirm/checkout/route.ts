import { NextRequest, NextResponse } from "next/server";

// ============================================
// AFFIRM CHECKOUT INTEGRATION
// Docs: https://docs.affirm.com/affirm-developers/docs/checkout-integration
// ============================================

const AFFIRM_PUBLIC_KEY = process.env.AFFIRM_PUBLIC_KEY;
const AFFIRM_PRIVATE_KEY = process.env.AFFIRM_PRIVATE_KEY;
const AFFIRM_ENV = process.env.AFFIRM_ENVIRONMENT || "sandbox"; // 'sandbox' or 'production'

const AFFIRM_API_BASE = AFFIRM_ENV === "production"
  ? "https://api.affirm.com/api/v2"
  : "https://sandbox.affirm.com/api/v2";

interface AffirmItem {
  display_name: string;
  sku: string;
  unit_price: number;  // In cents
  qty: number;
  item_image_url?: string;
  item_url?: string;
}

interface AffirmCheckoutRequest {
  merchant: {
    user_confirmation_url: string;
    user_cancel_url: string;
    user_confirmation_url_action?: string;
  };
  shipping: {
    name: {
      first: string;
      last: string;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
    phone_number?: string;
    email?: string;
  };
  billing?: {
    name: {
      first: string;
      last: string;
    };
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
    phone_number?: string;
    email?: string;
  };
  items: AffirmItem[];
  metadata?: {
    order_id?: string;
    layaway_plan_id?: string;
    [key: string]: string | undefined;
  };
  order_id?: string;
  currency?: string;
  shipping_amount?: number;  // In cents
  tax_amount?: number;       // In cents
  total?: number;            // In cents (calculated if not provided)
}

// ============================================
// POST - Create Affirm checkout session
// ============================================
export async function POST(req: NextRequest) {
  try {
    if (!AFFIRM_PUBLIC_KEY) {
      return NextResponse.json(
        { ok: false, message: "Affirm is not configured" },
        { status: 503 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Cart items are required" },
        { status: 400 }
      );
    }
    
    if (!body.shipping?.address) {
      return NextResponse.json(
        { ok: false, message: "Shipping address is required" },
        { status: 400 }
      );
    }
    
    // Parse customer name
    const nameParts = (body.customer?.name || "Customer").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "User";
    
    // Convert items to Affirm format (prices in cents)
    const affirmItems: AffirmItem[] = body.items.map((item: {
      id: string;
      name: string;
      sku?: string;
      price: number;
      quantity: number;
      image_url?: string;
    }) => ({
      display_name: item.name,
      sku: item.sku || item.id,
      unit_price: Math.round(item.price * 100),  // Convert to cents
      qty: item.quantity,
      item_image_url: item.image_url,
    }));
    
    // Calculate totals in cents
    const subtotalCents = affirmItems.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
    const shippingCents = Math.round((body.shipping_cost || 5.99) * 100);
    const taxCents = Math.round((body.tax_amount || 0) * 100);
    const totalCents = subtotalCents + shippingCents + taxCents;
    
    // Build base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create checkout request
    const checkoutRequest: AffirmCheckoutRequest = {
      merchant: {
        user_confirmation_url: `${baseUrl}/shop/checkout/affirm/confirm`,
        user_cancel_url: `${baseUrl}/shop/checkout/affirm/cancel`,
        user_confirmation_url_action: "POST",
      },
      shipping: {
        name: {
          first: firstName,
          last: lastName,
        },
        address: {
          line1: body.shipping.address,
          city: body.shipping.city,
          state: body.shipping.state,
          zipcode: body.shipping.zip,
          country: "USA",
        },
        phone_number: body.customer?.phone,
        email: body.customer?.email,
      },
      items: affirmItems,
      metadata: {
        order_id: body.order_id,
        layaway_plan_id: body.layaway_plan_id,
      },
      order_id: body.order_id,
      currency: "USD",
      shipping_amount: shippingCents,
      tax_amount: taxCents,
      total: totalCents,
    };
    
    // Return checkout config for Affirm.js SDK
    // Client will use this to launch Affirm modal
    return NextResponse.json({
      ok: true,
      checkout: {
        public_key: AFFIRM_PUBLIC_KEY,
        environment: AFFIRM_ENV,
        checkout_data: checkoutRequest,
        // Additional config for client SDK
        config: {
          financial_product_key: "HBRACING_LAYAWAY",
          // Suggested loan terms
          promo_id: body.promo_id,
        },
      },
      message: "Affirm checkout session ready",
    });
    
  } catch (err) {
    console.error("Affirm checkout error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create Affirm checkout" },
      { status: 500 }
    );
  }
}

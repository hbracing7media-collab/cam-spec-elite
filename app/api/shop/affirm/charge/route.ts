import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================
// AFFIRM CHARGE/CAPTURE API
// After user completes Affirm checkout, capture the charge
// ============================================

const AFFIRM_PRIVATE_KEY = process.env.AFFIRM_PRIVATE_KEY;
const AFFIRM_PUBLIC_KEY = process.env.AFFIRM_PUBLIC_KEY;
const AFFIRM_ENV = process.env.AFFIRM_ENVIRONMENT || "sandbox";

const AFFIRM_API_BASE = AFFIRM_ENV === "production"
  ? "https://api.affirm.com/api/v2"
  : "https://sandbox.affirm.com/api/v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// POST - Authorize/Capture Affirm charge
// Called after user completes Affirm checkout
// ============================================
export async function POST(req: NextRequest) {
  try {
    if (!AFFIRM_PRIVATE_KEY || !AFFIRM_PUBLIC_KEY) {
      return NextResponse.json(
        { ok: false, message: "Affirm is not configured" },
        { status: 503 }
      );
    }
    
    const body = await req.json();
    const { checkout_token, order_id, layaway_plan_id, action = "authorize" } = body;
    
    if (!checkout_token) {
      return NextResponse.json(
        { ok: false, message: "Checkout token is required" },
        { status: 400 }
      );
    }
    
    // Create Basic Auth header
    const authString = Buffer.from(`${AFFIRM_PUBLIC_KEY}:${AFFIRM_PRIVATE_KEY}`).toString("base64");
    
    // Authorize the charge (creates a charge but doesn't capture funds yet)
    const authorizeResponse = await fetch(`${AFFIRM_API_BASE}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify({
        checkout_token,
        order_id,
      }),
    });
    
    if (!authorizeResponse.ok) {
      const errorData = await authorizeResponse.json();
      console.error("Affirm authorize error:", errorData);
      return NextResponse.json(
        { ok: false, message: errorData.message || "Failed to authorize Affirm charge" },
        { status: 400 }
      );
    }
    
    const chargeData = await authorizeResponse.json();
    
    // If action is 'capture', immediately capture the funds
    if (action === "capture") {
      const captureResponse = await fetch(`${AFFIRM_API_BASE}/charges/${chargeData.id}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authString}`,
        },
      });
      
      if (!captureResponse.ok) {
        const captureError = await captureResponse.json();
        console.error("Affirm capture error:", captureError);
        // Don't fail - charge is authorized, can capture later
      } else {
        const captureData = await captureResponse.json();
        chargeData.captured = true;
        chargeData.capture_data = captureData;
      }
    }
    
    // Update layaway plan if applicable
    if (layaway_plan_id) {
      await supabase
        .from("layaway_plans")
        .update({
          payment_provider: "affirm",
          provider_plan_id: chargeData.id,
          provider_checkout_token: checkout_token,
          provider_metadata: {
            affirm_charge_id: chargeData.id,
            affirm_status: chargeData.status,
            financing_program: chargeData.financing_program,
            apr: chargeData.apr,
            interest_amount: chargeData.interest_amount,
          },
          status: "active", // Affirm handles payments, plan is active
          amount_paid: chargeData.amount / 100, // Affirm pays us full amount
          remaining_balance: 0,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", layaway_plan_id);
    }
    
    // Update order if applicable
    if (order_id) {
      await supabase
        .from("shop_orders")
        .update({
          status: "paid",
          payment_method: "affirm",
          payment_id: chargeData.id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_number", order_id);
    }
    
    return NextResponse.json({
      ok: true,
      charge: {
        id: chargeData.id,
        status: chargeData.status,
        amount: chargeData.amount / 100, // Convert from cents
        currency: chargeData.currency,
        captured: chargeData.captured || false,
        financing_program: chargeData.financing_program,
      },
      message: "Affirm payment authorized successfully",
    });
    
  } catch (err) {
    console.error("Affirm charge error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to process Affirm charge" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Check Affirm charge status
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chargeId = searchParams.get("charge_id");
    
    if (!chargeId) {
      return NextResponse.json(
        { ok: false, message: "Charge ID is required" },
        { status: 400 }
      );
    }
    
    if (!AFFIRM_PRIVATE_KEY || !AFFIRM_PUBLIC_KEY) {
      return NextResponse.json(
        { ok: false, message: "Affirm is not configured" },
        { status: 503 }
      );
    }
    
    const authString = Buffer.from(`${AFFIRM_PUBLIC_KEY}:${AFFIRM_PRIVATE_KEY}`).toString("base64");
    
    const response = await fetch(`${AFFIRM_API_BASE}/charges/${chargeId}`, {
      headers: {
        "Authorization": `Basic ${authString}`,
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "Charge not found" },
        { status: 404 }
      );
    }
    
    const chargeData = await response.json();
    
    return NextResponse.json({
      ok: true,
      charge: {
        id: chargeData.id,
        status: chargeData.status,
        amount: chargeData.amount / 100,
        captured: chargeData.status === "captured",
      },
    });
    
  } catch (err) {
    console.error("Affirm status check error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to check Affirm charge status" },
      { status: 500 }
    );
  }
}

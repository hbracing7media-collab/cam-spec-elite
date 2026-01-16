import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// GET - Get layaway settings
// ============================================
export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from("layaway_settings")
      .select("*")
      .single();
    
    if (error) {
      // Return defaults if not configured yet
      return NextResponse.json({
        ok: true,
        settings: {
          is_enabled: false,
          min_order_amount: 100,
          max_order_amount: 5000,
          min_down_payment_percent: 10,
          default_down_payment_percent: 25,
          available_frequencies: ["weekly", "biweekly", "monthly"],
          min_installments: 2,
          max_installments: 12,
          max_plan_duration_days: 90,
          late_fee_amount: 5.00,
          grace_period_days: 7,
          cancellation_fee_percent: 10,
          affirm_enabled: false,
          sezzle_enabled: false,
          afterpay_enabled: false,
          klarna_enabled: false,
          paypal_bnpl_enabled: false,
        },
      });
    }
    
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Settings GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch layaway settings" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update layaway settings (admin only)
// ============================================
export async function PUT(req: NextRequest) {
  try {
    // TODO: Add admin auth check
    const body = await req.json();
    
    const { data: settings, error } = await supabase
      .from("layaway_settings")
      .upsert({
        id: body.id || undefined,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Settings PUT error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to update layaway settings" },
      { status: 500 }
    );
  }
}

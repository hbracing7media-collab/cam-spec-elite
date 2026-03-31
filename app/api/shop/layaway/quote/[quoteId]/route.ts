import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// GET - Get quote by ID (public access with quote ID)
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;

    const { data: quote, error } = await supabase
      .from("layaway_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (error || !quote) {
      return NextResponse.json(
        { ok: false, message: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if quote is expired
    const validUntil = new Date(quote.valid_until);
    const now = new Date();
    if (now > validUntil && quote.status === "pending") {
      // Auto-expire
      await supabase
        .from("layaway_quotes")
        .update({ status: "expired", expired_at: new Date().toISOString() })
        .eq("id", quoteId);
      quote.status = "expired";
    }

    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("Quote GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Accept or decline quote
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await req.json();
    const { action, decline_reason, shipping } = body;

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { ok: false, message: "Action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Get the quote
    const { data: quote, error: fetchError } = await supabase
      .from("layaway_quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json(
        { ok: false, message: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if quote can still be acted upon
    if (quote.status !== "pending") {
      return NextResponse.json(
        { ok: false, message: `Quote has already been ${quote.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    const validUntil = new Date(quote.valid_until);
    if (new Date() > validUntil) {
      await supabase
        .from("layaway_quotes")
        .update({ status: "expired", expired_at: new Date().toISOString() })
        .eq("id", quoteId);
      return NextResponse.json(
        { ok: false, message: "Quote has expired" },
        { status: 400 }
      );
    }

    // Handle decline
    if (action === "decline") {
      const { error } = await supabase
        .from("layaway_quotes")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
          decline_reason: decline_reason || null,
        })
        .eq("id", quoteId);

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        message: "Quote declined",
      });
    }

    // Handle accept - create layaway plan
    const planNumber = `LAY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate payment schedule
    const totalAmount = quote.total_amount;
    const downPaymentPercent = quote.suggested_down_payment_percent || 25;
    const numPayments = quote.suggested_num_payments || 4;
    const paymentFrequency = quote.suggested_payment_frequency || "biweekly";

    const downPaymentAmount = Math.round((totalAmount * downPaymentPercent / 100) * 100) / 100;
    const remainingBalance = totalAmount - downPaymentAmount;
    const paymentAmount = Math.round((remainingBalance / numPayments) * 100) / 100;

    // Calculate payment dates
    const startDate = new Date();
    const paymentDates: Date[] = [];
    for (let i = 1; i <= numPayments; i++) {
      const nextDate = new Date(startDate);
      switch (paymentFrequency) {
        case "weekly":
          nextDate.setDate(nextDate.getDate() + 7 * i);
          break;
        case "biweekly":
          nextDate.setDate(nextDate.getDate() + 14 * i);
          break;
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + i);
          break;
      }
      paymentDates.push(nextDate);
    }
    const finalDueDate = paymentDates[paymentDates.length - 1];

    // Create the layaway plan
    const { data: plan, error: planError } = await supabase
      .from("layaway_plans")
      .insert({
        plan_number: planNumber,
        user_id: quote.user_id,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        items: quote.items,
        subtotal: quote.subtotal,
        tax_amount: quote.tax_amount,
        shipping_cost: quote.shipping_cost,
        total_amount: quote.total_amount,
        down_payment_amount: downPaymentAmount,
        down_payment_percent: downPaymentPercent,
        remaining_balance: remainingBalance,
        amount_paid: 0,
        payment_frequency: paymentFrequency,
        num_payments: numPayments,
        payment_amount: paymentAmount,
        start_date: startDate.toISOString().split("T")[0],
        next_payment_due: startDate.toISOString().split("T")[0],
        final_payment_due: finalDueDate.toISOString().split("T")[0],
        status: "pending_down_payment",
        payment_provider: "internal",
        customer_notes: quote.customer_notes,
      })
      .select()
      .single();

    if (planError) {
      console.error("Create plan error:", planError);
      throw planError;
    }

    // Create payment records
    const payments = [
      {
        plan_id: plan.id,
        payment_number: 0,
        amount: downPaymentAmount,
        late_fee: 0,
        total_charged: downPaymentAmount,
        due_date: startDate.toISOString().split("T")[0],
        status: "due",
      },
      ...paymentDates.map((date, index) => ({
        plan_id: plan.id,
        payment_number: index + 1,
        amount: paymentAmount,
        late_fee: 0,
        total_charged: paymentAmount,
        due_date: date.toISOString().split("T")[0],
        status: "pending",
      })),
    ];

    const { data: createdPayments, error: paymentsError } = await supabase
      .from("layaway_payments")
      .insert(payments)
      .select();

    if (paymentsError) {
      console.error("Create payments error:", paymentsError);
    }

    // Get the down payment ID (payment_number = 0)
    const downPayment = createdPayments?.find((p: any) => p.payment_number === 0);

    // Update the quote
    const { error: updateError } = await supabase
      .from("layaway_quotes")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        converted_plan_id: plan.id,
      })
      .eq("id", quoteId);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      message: "Quote accepted! Layaway plan created.",
      plan: {
        id: plan.id,
        plan_number: planNumber,
        down_payment_amount: downPaymentAmount,
        payment_amount: paymentAmount,
        num_payments: numPayments,
        payment_frequency: paymentFrequency,
        down_payment_id: downPayment?.id,
      },
    });
  } catch (err) {
    console.error("Quote POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to process quote" },
      { status: 500 }
    );
  }
}

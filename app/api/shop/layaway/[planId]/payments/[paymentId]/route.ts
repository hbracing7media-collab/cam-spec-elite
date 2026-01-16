import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface PaymentRequest {
  payment_method: string;   // 'card', 'paypal', 'affirm'
  transaction_id?: string;  // External payment reference
  is_autopay?: boolean;
}

// ============================================
// POST - Process a layaway payment
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; paymentId: string }> }
) {
  try {
    const { planId, paymentId } = await params;
    const body: PaymentRequest = await req.json();
    
    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("layaway_payments")
      .select("*, layaway_plans(*)")
      .eq("id", paymentId)
      .eq("plan_id", planId)
      .single();
    
    if (paymentError || !payment) {
      return NextResponse.json(
        { ok: false, message: "Payment not found" },
        { status: 404 }
      );
    }
    
    // Validate payment can be made
    if (payment.status === "paid") {
      return NextResponse.json(
        { ok: false, message: "This payment has already been processed" },
        { status: 400 }
      );
    }
    
    if (payment.status === "refunded") {
      return NextResponse.json(
        { ok: false, message: "This payment has been refunded" },
        { status: 400 }
      );
    }
    
    // Check plan status
    const plan = payment.layaway_plans;
    if (plan.status === "cancelled" || plan.status === "forfeited") {
      return NextResponse.json(
        { ok: false, message: "This layaway plan is no longer active" },
        { status: 400 }
      );
    }
    
    // Calculate late fee if applicable
    let lateFee = 0;
    const dueDate = new Date(payment.due_date);
    const now = new Date();
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (plan.grace_period_days || 7));
    
    if (now > gracePeriodEnd && payment.status !== "pending") {
      lateFee = plan.late_fee_amount || 5.00;
    }
    
    const totalCharged = payment.amount + lateFee;
    
    // Update payment record
    const { error: updateError } = await supabase
      .from("layaway_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: body.payment_method,
        transaction_id: body.transaction_id,
        late_fee: lateFee,
        total_charged: totalCharged,
        is_autopay: body.is_autopay || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);
    
    if (updateError) throw updateError;
    
    // The trigger will update the plan automatically, but we can also do it here
    // for immediate response
    const newAmountPaid = (plan.amount_paid || 0) + totalCharged;
    const newRemainingBalance = plan.total_amount - newAmountPaid;
    const isCompleted = newRemainingBalance <= 0;
    
    // Get next payment due
    const { data: nextPayment } = await supabase
      .from("layaway_payments")
      .select("due_date")
      .eq("plan_id", planId)
      .in("status", ["pending", "due"])
      .order("due_date", { ascending: true })
      .limit(1)
      .single();
    
    await supabase
      .from("layaway_plans")
      .update({
        amount_paid: newAmountPaid,
        remaining_balance: newRemainingBalance,
        status: isCompleted ? "completed" : payment.payment_number === 0 ? "active" : plan.status,
        next_payment_due: nextPayment?.due_date || null,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);
    
    return NextResponse.json({
      ok: true,
      message: isCompleted 
        ? "Congratulations! Your layaway plan is complete. Your items will ship soon!"
        : `Payment of $${totalCharged.toFixed(2)} processed successfully.`,
      payment: {
        id: paymentId,
        amount: payment.amount,
        late_fee: lateFee,
        total_charged: totalCharged,
        status: "paid",
      },
      plan: {
        amount_paid: newAmountPaid,
        remaining_balance: newRemainingBalance,
        status: isCompleted ? "completed" : "active",
        next_payment_due: nextPayment?.due_date,
      },
    });
    
  } catch (err) {
    console.error("Payment processing error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to process payment" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get payment details
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; paymentId: string }> }
) {
  try {
    const { planId, paymentId } = await params;
    
    const { data: payment, error } = await supabase
      .from("layaway_payments")
      .select("*")
      .eq("id", paymentId)
      .eq("plan_id", planId)
      .single();
    
    if (error || !payment) {
      return NextResponse.json(
        { ok: false, message: "Payment not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ok: true, payment });
    
  } catch (err) {
    console.error("Payment GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

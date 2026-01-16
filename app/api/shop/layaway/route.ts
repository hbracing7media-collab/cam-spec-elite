import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateSalesTax } from "@/lib/salesTax";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// TYPES
// ============================================
interface LayawayItem {
  id: string;
  name: string;
  sku?: string;
  size?: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface CreateLayawayRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    user_id?: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  items: LayawayItem[];
  plan_config: {
    down_payment_percent: number;  // 10-50%
    payment_frequency: "weekly" | "biweekly" | "monthly";
    num_payments: number;          // 2-12
  };
  payment_provider?: string;
  notes?: string;
}

// ============================================
// HELPERS
// ============================================
function generateLayawayNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LAY-${dateStr}-${random}`;
}

function calculatePaymentSchedule(
  totalAmount: number,
  downPaymentPercent: number,
  numPayments: number,
  frequency: string,
  startDate: Date
): {
  downPayment: number;
  remainingBalance: number;
  installmentAmount: number;
  paymentDates: Date[];
  finalDueDate: Date;
} {
  const downPayment = Math.round((totalAmount * downPaymentPercent / 100) * 100) / 100;
  const remainingBalance = totalAmount - downPayment;
  const installmentAmount = Math.round((remainingBalance / numPayments) * 100) / 100;
  
  const paymentDates: Date[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 1; i <= numPayments; i++) {
    const nextDate = new Date(currentDate);
    switch (frequency) {
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
  
  return {
    downPayment,
    remainingBalance,
    installmentAmount,
    paymentDates,
    finalDueDate: paymentDates[paymentDates.length - 1],
  };
}

// ============================================
// GET - Fetch layaway plans
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");
    const planNumber = searchParams.get("plan_number");
    const email = searchParams.get("email");
    const userId = searchParams.get("user_id");
    
    // Single plan lookup by ID or plan number
    if (planId || planNumber) {
      const { data: plan, error } = await supabase
        .from("layaway_plans")
        .select("*, layaway_payments(*)")
        .or(`id.eq.${planId || ""},plan_number.eq.${planNumber || ""}`)
        .single();
      
      if (error) {
        return NextResponse.json(
          { ok: false, message: "Layaway plan not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ ok: true, plan });
    }
    
    // User's plans
    if (userId || email) {
      const { data: plans, error } = await supabase
        .from("layaway_plans")
        .select("*, layaway_payments(*)")
        .or(`user_id.eq.${userId || ""},customer_email.eq.${email || ""}`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return NextResponse.json({ ok: true, plans });
    }
    
    return NextResponse.json(
      { ok: false, message: "Please provide plan_id, plan_number, email, or user_id" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Layaway GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch layaway plans" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create new layaway plan
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body: CreateLayawayRequest = await req.json();
    
    // Validate required fields
    if (!body.customer?.name || !body.customer?.email) {
      return NextResponse.json(
        { ok: false, message: "Customer name and email are required" },
        { status: 400 }
      );
    }
    
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Cart is empty" },
        { status: 400 }
      );
    }
    
    // Fetch layaway settings
    const { data: settings } = await supabase
      .from("layaway_settings")
      .select("*")
      .single();
    
    if (!settings?.is_enabled) {
      return NextResponse.json(
        { ok: false, message: "Layaway is currently not available" },
        { status: 400 }
      );
    }
    
    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = 5.99;
    const taxInfo = calculateSalesTax(subtotal, body.shipping.state, false, shippingCost);
    const totalAmount = subtotal + shippingCost + taxInfo.taxAmount;
    
    // Validate against settings
    if (subtotal < (settings.min_order_amount || 100)) {
      return NextResponse.json(
        { ok: false, message: `Minimum order for layaway is $${settings.min_order_amount}` },
        { status: 400 }
      );
    }
    
    if (subtotal > (settings.max_order_amount || 5000)) {
      return NextResponse.json(
        { ok: false, message: `Maximum order for layaway is $${settings.max_order_amount}` },
        { status: 400 }
      );
    }
    
    // Validate plan config
    const { down_payment_percent, payment_frequency, num_payments } = body.plan_config;
    
    if (down_payment_percent < (settings.min_down_payment_percent || 10)) {
      return NextResponse.json(
        { ok: false, message: `Minimum down payment is ${settings.min_down_payment_percent}%` },
        { status: 400 }
      );
    }
    
    if (num_payments < (settings.min_installments || 2) || 
        num_payments > (settings.max_installments || 12)) {
      return NextResponse.json(
        { ok: false, message: `Installments must be between ${settings.min_installments}-${settings.max_installments}` },
        { status: 400 }
      );
    }
    
    // Calculate payment schedule
    const startDate = new Date();
    const schedule = calculatePaymentSchedule(
      totalAmount,
      down_payment_percent,
      num_payments,
      payment_frequency,
      startDate
    );
    
    // Check max plan duration
    const maxDays = settings.max_plan_duration_days || 90;
    const planDurationDays = Math.ceil(
      (schedule.finalDueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (planDurationDays > maxDays) {
      return NextResponse.json(
        { ok: false, message: `Plan duration cannot exceed ${maxDays} days. Try fewer installments or a higher frequency.` },
        { status: 400 }
      );
    }
    
    // Create layaway plan
    const planNumber = generateLayawayNumber();
    
    const { data: plan, error: planError } = await supabase
      .from("layaway_plans")
      .insert({
        plan_number: planNumber,
        user_id: body.customer.user_id || null,
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone,
        items: body.items,
        subtotal,
        tax_amount: taxInfo.taxAmount,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        down_payment_amount: schedule.downPayment,
        down_payment_percent,
        remaining_balance: schedule.remainingBalance,
        amount_paid: 0,
        payment_frequency,
        num_payments,
        payment_amount: schedule.installmentAmount,
        start_date: startDate.toISOString().split("T")[0],
        next_payment_due: startDate.toISOString().split("T")[0], // Down payment due now
        final_payment_due: schedule.finalDueDate.toISOString().split("T")[0],
        status: "pending_down_payment",
        payment_provider: body.payment_provider || "internal",
        late_fee_amount: settings.late_fee_amount || 5.00,
        grace_period_days: settings.grace_period_days || 7,
        cancellation_fee_percent: settings.cancellation_fee_percent || 10,
        customer_notes: body.notes,
      })
      .select()
      .single();
    
    if (planError) {
      console.error("Create plan error:", planError);
      throw planError;
    }
    
    // Create payment schedule records
    const payments = [
      // Down payment (payment 0)
      {
        plan_id: plan.id,
        payment_number: 0,
        amount: schedule.downPayment,
        late_fee: 0,
        total_charged: schedule.downPayment,
        due_date: startDate.toISOString().split("T")[0],
        status: "due",
      },
      // Installments (payments 1-N)
      ...schedule.paymentDates.map((date, idx) => ({
        plan_id: plan.id,
        payment_number: idx + 1,
        amount: schedule.installmentAmount,
        late_fee: 0,
        total_charged: schedule.installmentAmount,
        due_date: date.toISOString().split("T")[0],
        status: "pending",
      })),
    ];
    
    const { error: paymentsError } = await supabase
      .from("layaway_payments")
      .insert(payments);
    
    if (paymentsError) {
      console.error("Create payments error:", paymentsError);
      // Rollback plan
      await supabase.from("layaway_plans").delete().eq("id", plan.id);
      throw paymentsError;
    }
    
    // Return plan with payment schedule
    return NextResponse.json({
      ok: true,
      plan: {
        ...plan,
        payments,
      },
      message: `Layaway plan ${planNumber} created. Down payment of $${schedule.downPayment.toFixed(2)} due now.`,
    });
    
  } catch (err) {
    console.error("Layaway POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create layaway plan" },
      { status: 500 }
    );
  }
}

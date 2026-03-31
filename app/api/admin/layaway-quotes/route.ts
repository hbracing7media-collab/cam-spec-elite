import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { cookies } from "next/headers";
import { notifyCustomerLayawayQuote } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// TYPES
// ============================================
interface QuoteItem {
  id?: string;
  name: string;
  sku?: string;
  size?: string;
  quantity: number;
  price: number;
  image_url?: string;
  description?: string;
}

interface CreateQuoteRequest {
  customer: {
    name: string;
    email: string;
    phone?: string;
    user_id?: string;
  };
  shipping?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  items: QuoteItem[];
  plan_config?: {
    down_payment_percent?: number;  // 10-50%, defaults to 25
    payment_frequency?: "weekly" | "biweekly" | "monthly";
    num_payments?: number;          // 2-12, defaults to 4
  };
  discount?: {
    amount: number;
    description?: string;
  };
  valid_days?: number;  // Days until quote expires, defaults to 14
  customer_notes?: string;
  admin_notes?: string;
}

// ============================================
// HELPERS
// ============================================
function generateQuoteNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QTE-${dateStr}-${random}`;
}

async function verifyAuth(): Promise<{ isAuthed: boolean; userId: string | null }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  
  if (!accessToken) {
    return { isAuthed: false, userId: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { isAuthed: false, userId: null };
  }

  // User is authenticated - for now, being logged in is sufficient for admin access
  // In production, you could add role checking here
  return { isAuthed: true, userId: user.id };
}

// ============================================
// GET - List quotes (admin only)
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { isAuthed } = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const quoteId = searchParams.get("id");

    let query = supabase
      .from("layaway_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (quoteId) {
      query = query.eq("id", quoteId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (email) {
      query = query.ilike("customer_email", `%${email}%`);
    }

    const { data: quotes, error } = await query;

    if (error) throw error;

    return NextResponse.json({ ok: true, quotes });
  } catch (err) {
    console.error("Admin quotes GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create new quote (admin only)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const { isAuthed, userId } = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body: CreateQuoteRequest = await req.json();

    // Validate required fields
    if (!body.customer?.name || !body.customer?.email) {
      return NextResponse.json(
        { ok: false, message: "Customer name and email are required" },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = body.discount?.amount || 0;
    const shippingCost = 5.99;
    
    // Tax is not calculated at quote time - it will be calculated 
    // when the customer pays via Stripe (using their shipping address)
    const taxAmount = 0;
    const totalAmount = subtotal - discountAmount + shippingCost;

    // Payment structure
    const downPaymentPercent = body.plan_config?.down_payment_percent || 25;
    const numPayments = body.plan_config?.num_payments || 4;
    const paymentFrequency = body.plan_config?.payment_frequency || "biweekly";

    const downPaymentAmount = Math.round((totalAmount * downPaymentPercent / 100) * 100) / 100;
    const remainingBalance = totalAmount - downPaymentAmount;
    const paymentAmount = Math.round((remainingBalance / numPayments) * 100) / 100;

    // Quote validity
    const validDays = body.valid_days || 14;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Find user by email if not provided
    let customerId = body.customer.user_id;
    if (!customerId) {
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("email", body.customer.email)
        .single();
      
      if (existingUser) {
        customerId = existingUser.user_id;
      }
    }

    // Create the quote
    const quoteNumber = generateQuoteNumber();

    const { data: quote, error } = await supabase
      .from("layaway_quotes")
      .insert({
        quote_number: quoteNumber,
        user_id: customerId || null,
        customer_name: body.customer.name,
        customer_email: body.customer.email.toLowerCase(),
        customer_phone: body.customer.phone || null,
        items: body.items,
        subtotal,
        tax_amount: taxAmount,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        discount_description: body.discount?.description || null,
        suggested_down_payment_percent: downPaymentPercent,
        suggested_payment_frequency: paymentFrequency,
        suggested_num_payments: numPayments,
        suggested_down_payment_amount: downPaymentAmount,
        suggested_payment_amount: paymentAmount,
        valid_until: validUntil.toISOString().split("T")[0],
        status: "pending",
        customer_notes: body.customer_notes || null,
        admin_notes: body.admin_notes || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification to customer about the quote
    const quoteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://cam-spec-elite.vercel.app"}/shop/layaway/quote/${quote.id}`;
    
    try {
      await notifyCustomerLayawayQuote({
        quoteNumber: quoteNumber,
        customerName: body.customer.name,
        customerEmail: body.customer.email,
        items: body.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          description: item.description,
        })),
        subtotal,
        discountAmount,
        discountDescription: body.discount?.description,
        shippingCost,
        totalAmount,
        downPaymentAmount,
        downPaymentPercent,
        paymentAmount,
        numPayments,
        paymentFrequency,
        validUntil: validUntil.toISOString().split("T")[0],
        quoteUrl,
        customerNotes: body.customer_notes,
      });
      console.log(`Quote ${quoteNumber} email sent to ${body.customer.email}`);
    } catch (emailErr) {
      console.error("Failed to send quote email:", emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      ok: true,
      message: "Quote created successfully",
      quote,
      quote_url: quoteUrl,
    });
  } catch (err) {
    console.error("Admin quote POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to create quote" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update quote (admin only)
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const { isAuthed } = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Quote ID is required" },
        { status: 400 }
      );
    }

    // Recalculate totals if items changed
    if (updates.items) {
      const subtotal = updates.items.reduce(
        (sum: number, item: QuoteItem) => sum + item.price * item.quantity, 
        0
      );
      const discountAmount = updates.discount_amount || 0;
      const shippingCost = updates.shipping_cost || 5.99;
      const taxAmount = updates.tax_amount || 0;
      
      updates.subtotal = subtotal;
      updates.total_amount = subtotal - discountAmount + shippingCost + taxAmount;

      // Recalculate payment amounts
      const downPaymentPercent = updates.suggested_down_payment_percent || 25;
      const numPayments = updates.suggested_num_payments || 4;
      
      updates.suggested_down_payment_amount = 
        Math.round((updates.total_amount * downPaymentPercent / 100) * 100) / 100;
      updates.suggested_payment_amount = 
        Math.round(((updates.total_amount - updates.suggested_down_payment_amount) / numPayments) * 100) / 100;
    }

    const { data: quote, error } = await supabase
      .from("layaway_quotes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error("Admin quote PUT error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to update quote" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Cancel/delete quote (admin only)
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const { isAuthed } = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Quote ID is required" },
        { status: 400 }
      );
    }

    // Soft delete - mark as cancelled
    const { error } = await supabase
      .from("layaway_quotes")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Quote cancelled" });
  } catch (err) {
    console.error("Admin quote DELETE error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to cancel quote" },
      { status: 500 }
    );
  }
}

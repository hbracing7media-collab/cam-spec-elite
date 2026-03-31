import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ============================================
// GET - Get user's layaway quotes
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("user_id");

    if (!email && !userId) {
      return NextResponse.json(
        { ok: false, message: "Email or user_id is required" },
        { status: 400 }
      );
    }

    // Build query to find quotes for this user
    let query = supabase
      .from("layaway_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      // Find by user_id or email
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("user_id", userId)
        .single();

      if (userProfile?.email) {
        query = query.or(`user_id.eq.${userId},customer_email.ilike.${userProfile.email}`);
      } else {
        query = query.eq("user_id", userId);
      }
    } else if (email) {
      query = query.ilike("customer_email", email);
    }

    const { data: quotes, error } = await query;

    if (error) throw error;

    // Auto-expire any pending quotes that are past their valid_until date
    const now = new Date();
    const expiredQuotes = quotes?.filter(
      (q: any) => q.status === "pending" && new Date(q.valid_until) < now
    ) || [];

    if (expiredQuotes.length > 0) {
      for (const quote of expiredQuotes) {
        await supabase
          .from("layaway_quotes")
          .update({ status: "expired", expired_at: now.toISOString() })
          .eq("id", quote.id);
        quote.status = "expired";
      }
    }

    return NextResponse.json({ ok: true, quotes: quotes || [] });
  } catch (err) {
    console.error("User quotes GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

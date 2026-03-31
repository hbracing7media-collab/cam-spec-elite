import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    console.log("Fetching quotes for:", { email, userId });

    if (!email && !userId) {
      return NextResponse.json(
        { ok: false, message: "Email or user_id is required" },
        { status: 400 }
      );
    }

    let userEmail = email?.toLowerCase();

    // If we have userId but no email, get email from auth.users via admin API
    if (userId && !email) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        userEmail = authUser.user.email.toLowerCase();
      }
    }

    console.log("Looking for quotes with email:", userEmail, "or userId:", userId);

    // Query quotes - use separate queries and combine results to avoid syntax issues
    let allQuotes: any[] = [];

    // Query by user_id if available
    if (userId) {
      const { data: userIdQuotes } = await supabase
        .from("layaway_quotes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (userIdQuotes) {
        allQuotes.push(...userIdQuotes);
      }
    }

    // Query by email if available
    if (userEmail) {
      const { data: emailQuotes } = await supabase
        .from("layaway_quotes")
        .select("*")
        .ilike("customer_email", userEmail)
        .order("created_at", { ascending: false });
      
      if (emailQuotes) {
        // Add quotes not already in the list (avoid duplicates)
        for (const quote of emailQuotes) {
          if (!allQuotes.find(q => q.id === quote.id)) {
            allQuotes.push(quote);
          }
        }
      }
    }

    // Sort by created_at descending
    allQuotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log("Found quotes:", allQuotes.length);

    // Auto-expire any pending quotes that are past their valid_until date
    const now = new Date();
    const expiredQuotes = allQuotes.filter(
      (q: any) => q.status === "pending" && new Date(q.valid_until) < now
    );

    if (expiredQuotes.length > 0) {
      for (const quote of expiredQuotes) {
        await supabase
          .from("layaway_quotes")
          .update({ status: "expired", expired_at: now.toISOString() })
          .eq("id", quote.id);
        quote.status = "expired";
      }
    }

    return NextResponse.json({ ok: true, quotes: allQuotes });
  } catch (err) {
    console.error("User quotes GET error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

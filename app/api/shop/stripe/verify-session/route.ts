import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      return NextResponse.json(
        { ok: false, message: "Session ID required" },
        { status: 400 }
      );
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });
    
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, message: "Payment not completed" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        amount_total: session.amount_total,
        total_details: session.total_details,
        customer_email: session.customer_details?.email || session.customer_email,
        metadata: session.metadata,
        payment_status: session.payment_status,
      },
    });
    
  } catch (err) {
    console.error("Verify session error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to verify session" },
      { status: 500 }
    );
  }
}

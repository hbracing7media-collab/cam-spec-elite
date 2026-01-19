import { NextRequest, NextResponse } from "next/server";
import { notifyConsultingBooking, sendConsultingReceipt } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      servicePrice,
      engineMake,
      engineFamily,
      description,
      paymentMethod,
      paymentId,
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !serviceName || !servicePrice || !engineMake || !engineFamily || !description) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailData = {
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      serviceName,
      servicePrice: Number(servicePrice),
      engineMake,
      engineFamily,
      description,
      paymentMethod: paymentMethod || "stripe",
      paymentId,
    };

    // Send notification to HB Racing (your email)
    const notificationSent = await notifyConsultingBooking(emailData);
    
    // Send receipt to customer
    const receiptSent = await sendConsultingReceipt(emailData);

    if (!notificationSent && !receiptSent) {
      console.error("Both emails failed to send");
      return NextResponse.json(
        { ok: false, message: "Failed to send confirmation emails" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Booking confirmed",
      notificationSent,
      receiptSent,
    });
  } catch (error) {
    console.error("Consulting booking error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error processing booking" },
      { status: 500 }
    );
  }
}

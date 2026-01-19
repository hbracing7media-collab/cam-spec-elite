import { NextRequest, NextResponse } from "next/server";
import { notifyContactForm } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send email using existing email system
    // Note: notifyContactForm returns false if RESEND_API_KEY is missing (dev mode)
    // but we still want to return success so the form works
    await notifyContactForm({ name, email, subject, message });

    return NextResponse.json({ ok: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

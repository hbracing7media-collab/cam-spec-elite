import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side signup endpoint
 * Handles email/password signup with proper configuration
 */
export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Validate inputs
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "Email and password required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ok: false, message: "Server misconfigured" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the origin for email redirect URL
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Sign up with email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[SIGNUP_ERROR]", error.message);
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 }
      );
    }

    // Return success with info about verification
    return NextResponse.json(
      {
        ok: true,
        message: "Signup successful! Please check your email to confirm your account.",
        user: data.user?.id,
        requiresConfirmation: !data.user?.email_confirmed_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[SIGNUP_EXCEPTION]", err);
    return NextResponse.json(
      { ok: false, message: "Signup failed" },
      { status: 500 }
    );
  }
}

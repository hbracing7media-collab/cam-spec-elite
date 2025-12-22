// Debug Email Verification Flow
// Add this to your signup route temporarily to see what's happening

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LOG_PREFIX = "[EMAIL_DEBUG]";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  console.log(`${LOG_PREFIX} Signup attempt for: ${email}`);

  // Validate inputs
  if (!email || !password) {
    console.log(`${LOG_PREFIX} Missing email or password`);
    return NextResponse.json(
      { ok: false, message: "Email and password required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  console.log(`${LOG_PREFIX} Config check:`);
  console.log(`  - Supabase URL: ${supabaseUrl ? "✅ SET" : "❌ MISSING"}`);
  console.log(`  - Anon Key: ${supabaseAnonKey ? "✅ SET" : "❌ MISSING"}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(`${LOG_PREFIX} Server misconfigured`);
    return NextResponse.json(
      { ok: false, message: "Server misconfigured" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the origin for email redirect URL
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${origin}/auth/callback`;

    console.log(`${LOG_PREFIX} Email config:`);
    console.log(`  - Email: ${email}`);
    console.log(`  - Origin: ${origin}`);
    console.log(`  - Redirect URL: ${redirectUrl}`);

    // Sign up with email confirmation
    console.log(`${LOG_PREFIX} Calling supabase.auth.signUp()...`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error(`${LOG_PREFIX} Signup error:`, {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code,
        details: error,
      });

      return NextResponse.json(
        { 
          ok: false, 
          message: error.message,
          debug: {
            errorCode: (error as any).code,
            errorStatus: (error as any).status,
            fullError: error,
          }
        },
        { status: 400 }
      );
    }

    console.log(`${LOG_PREFIX} Signup success:`, {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: !!data.user?.email_confirmed_at,
      createdAt: data.user?.created_at,
    });

    // Check if user was created
    if (!data.user) {
      console.error(`${LOG_PREFIX} User object is null/undefined after signup`);
      return NextResponse.json(
        { 
          ok: false, 
          message: "User created but no data returned",
          debug: { data }
        },
        { status: 400 }
      );
    }

    // Log the session info if any
    if (data.session) {
      console.log(`${LOG_PREFIX} Session created:`, {
        hasAccessToken: !!data.session.access_token,
        expiresAt: data.session.expires_at,
      });
    } else {
      console.log(`${LOG_PREFIX} No session returned (expected - email confirmation required)`);
    }

    console.log(`${LOG_PREFIX} ✅ Signup complete. User should receive confirmation email.`);

    return NextResponse.json(
      {
        ok: true,
        message: "Signup successful! Please check your email to confirm your account.",
        user: data.user?.id,
        requiresConfirmation: !data.user?.email_confirmed_at,
        debug: {
          emailSent: true,
          redirectUrl: redirectUrl,
          userCreated: !!data.user,
          checkEmailAt: email,
        }
      },
      { status: 201 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} Exception during signup:`, {
      error: errorMsg,
      stack: err instanceof Error ? err.stack : null,
    });

    return NextResponse.json(
      { 
        ok: false, 
        message: "Signup failed",
        debug: { error: errorMsg }
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Diagnostic endpoint to check email sending status
 * POST to this endpoint to get detailed auth configuration info
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase credentials",
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceRole: !!supabaseServiceRole,
          appUrl: appUrl || "NOT SET - will use request origin",
        },
      },
      { status: 500 }
    );
  }

  try {
    // Test connection with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRole || supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Try to get auth settings
    const { data: authUsers, error: usersError } = await supabase
      .from("auth.users")
      .select("id, email, email_confirmed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json(
      {
        ok: true,
        environment: {
          supabaseUrl: supabaseUrl.split(".supabase.co")[0] + ".supabase.co", // Mask domain
          hasAnonKey: !!supabaseAnonKey,
          hasServiceRoleKey: !!supabaseServiceRole,
          appUrl: appUrl || "NOT SET",
          nodeEnv: process.env.NODE_ENV,
        },
        recentSignups: usersError
          ? {
              error: usersError.message,
              hint: "Check that service role key is valid and has auth.users SELECT permission",
            }
          : authUsers || [],
        diagnosticInfo: {
          signupEndpoint: "/api/auth/signup (POST)",
          callbackEndpoint: "/auth/callback (GET with ?code=...)",
          expectedRedirectUrl: appUrl ? `${appUrl}/auth/callback` : "Will use request origin",
          note: "Check Supabase Dashboard > Authentication > Email Provider to ensure email sending is enabled",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: error,
        hint: "Check that SUPABASE_SERVICE_ROLE_KEY is set correctly",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Test sending a verification email
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email parameter required" },
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Attempt signup with detailed error logging
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const testEmail = email;
    const testPassword = "TestPassword123!"; // Temporary test password

    console.log(`[EMAIL_TEST] Attempting signup for: ${testEmail}`);
    console.log(`[EMAIL_TEST] Redirect URL: ${origin}/auth/callback`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[EMAIL_TEST_ERROR]", error);
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          details: {
            code: (error as any).code,
            status: (error as any).status,
            hint: "Check Supabase Dashboard > Logs for email sending errors",
          },
        },
        { status: 400 }
      );
    }

    console.log("[EMAIL_TEST_SUCCESS]", {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: !!data.user?.email_confirmed_at,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Test email signup created. Check email inbox for verification link.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
          emailConfirmed: !!data.user?.email_confirmed_at,
          createdAt: data.user?.created_at,
        },
        nextSteps: [
          "Check email inbox for verification email",
          "If not received, check Supabase Dashboard > Authentication > Email Provider",
          "If email received, click the confirmation link",
          "You will be redirected to /auth/callback and logged in",
        ],
      },
      { status: 201 }
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL_TEST_EXCEPTION]", error);
    return NextResponse.json(
      { ok: false, message: error },
      { status: 500 }
    );
  }
}

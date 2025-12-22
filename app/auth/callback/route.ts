import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Email confirmation callback handler
 * Supabase redirects here after user clicks email confirmation link
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_confirmation", req.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL("/auth/login?error=server_misconfigured", req.url)
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[CONFIRM_EMAIL_ERROR]", error.message);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`,
          req.url
        )
      );
    }

    if (!data.session) {
      return NextResponse.redirect(
        new URL("/auth/login?error=no_session", req.url)
      );
    }

    // Set auth cookies
    const response = NextResponse.redirect(new URL(next, req.url));

    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[CONFIRM_EMAIL_EXCEPTION]", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=confirmation_error", req.url)
    );
  }
}

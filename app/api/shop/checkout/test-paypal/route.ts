import { NextResponse } from "next/server";

const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || "sandbox";
  const publicClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Check configuration
  const config = {
    mode,
    apiUrl: PAYPAL_API,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasPublicClientId: !!publicClientId,
    clientIdPrefix: clientId?.substring(0, 12),
    publicClientIdPrefix: publicClientId?.substring(0, 12),
    clientIdMatches: clientId === publicClientId,
  };

  console.log("PayPal Config Check:", config);

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      ok: false,
      message: "PayPal credentials not configured",
      config,
    });
  }

  // Try to authenticate
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        message: "Authentication failed",
        config,
        error: {
          status: response.status,
          error: data.error,
          error_description: data.error_description,
        },
        help: mode === "live" 
          ? "Live mode requires: 1) Fully verified PayPal Business account, 2) Live app credentials from developer.paypal.com, 3) App must be in 'Live' mode not 'Sandbox'"
          : "Sandbox mode - check your sandbox app credentials",
      });
    }

    return NextResponse.json({
      ok: true,
      message: `PayPal ${mode} authentication successful!`,
      config,
      token: {
        type: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope?.split(" ").slice(0, 3).join(", ") + "...",
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: "Request failed",
      config,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

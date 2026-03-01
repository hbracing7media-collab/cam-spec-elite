import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
// - profile: user profile pages
// - admin: admin dashboards
// - forum: all forum pages (viewing and posting)
// - cams/new, cams/submit: creating new cams requires login (browsing is public)
// - cylinder-heads/submit: submitting heads requires login (browsing is public)
// - dyno-wars/submit: submitting dyno results
// - shop/checkout: checking out requires login (browsing shop is public)
// - shop/layaway: layaway management requires login
const PROTECTED_ROUTES = [
  "/profile",
  "/admin",
  "/forum",
  "/cams/new",
  "/cams/submit",
  "/cylinder-heads/submit",
  "/dyno-wars/submit",
  "/shop/checkout",
  "/shop/layaway",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  const pathname = req.nextUrl.pathname;

  // Check if this specific route requires auth
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  
  if (!isProtected) {
    return res;
  }

  // Check for sb-access-token cookie
  const accessToken = req.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

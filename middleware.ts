import { NextResponse, type NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/cam-calculator",
  "/auth",
  "/api",
  "/logout",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  const pathname = req.nextUrl.pathname;

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return res;
  }

  // Check for sb-access-token cookie (your existing auth system)
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

import { NextResponse, type NextRequest } from "next/server";

// Only these specific routes require authentication
const PROTECTED_ROUTES = [
  "/profile",
  "/admin",
  "/forum/new",
  "/cams/new",
  "/cylinder-heads/submit",
  "/dyno-wars/submit",
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

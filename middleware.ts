import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/calculators",
  "/forum/new",
  "/cams/new",
  "/cylinder-heads/submit",
  "/dyno-wars/submit",
  "/profile",
  "/admin",
];

// Routes that should NOT require auth (public pages)
const PUBLIC_ROUTES = [
  "/calculators/cam-horsepower-calculator", // SEO landing page
];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Check if this is a public route (allow access)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route);
  if (isPublicRoute) {
    return res;
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  // If protected route and no user, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

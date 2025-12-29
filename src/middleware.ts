import { type NextRequest, NextResponse } from "next/server";

/**
 * Public paths that don't require authentication.
 * These routes are accessible without a valid session.
 */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/health",
  "/design-system",
];

/**
 * Session cookie configuration.
 * The session cookie is HttpOnly, but we also set a non-HttpOnly
 * expiry cookie that the middleware can inspect without decoding JWT.
 */
const SESSION_COOKIE = "fixit_session";
const SESSION_EXPIRY_COOKIE = "fixit_session_exp";

/**
 * Check if the session has expired based on the expiry cookie.
 * This allows Edge Runtime to validate sessions without JWT decoding.
 *
 * @param request - The incoming request
 * @returns true if session is valid (not expired), false otherwise
 */
function isSessionValid(request: NextRequest): boolean {
  const session = request.cookies.get(SESSION_COOKIE);
  const expiry = request.cookies.get(SESSION_EXPIRY_COOKIE);

  // No session cookie means not authenticated
  if (!session) {
    return false;
  }

  // If we have an expiry cookie, check if it's still valid
  if (expiry?.value) {
    const expiryTime = Number.parseInt(expiry.value, 10);
    if (!Number.isNaN(expiryTime) && Date.now() > expiryTime) {
      // Session has expired
      return false;
    }
  }

  // Session exists and is not expired (or no expiry cookie set - legacy)
  return true;
}

/**
 * Middleware for authentication and route protection.
 *
 * This middleware runs on the Edge Runtime and performs:
 * 1. Public path bypass for login, logout, etc.
 * 2. Static asset bypass
 * 3. Session existence and expiry validation
 * 4. Redirection to login for unauthenticated users
 *
 * Note: Fine-grained role/permission checks are done in page/API handlers
 * since Edge Runtime has limited crypto capabilities for full JWT verification.
 * The session is fully verified server-side in requireAuth/getCurrentUser.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // Define allowed domains (localhost for dev, actual domain for prod)
  // Adjust this logic based on your actual domain setup
  const isAppSubdomain = hostname.startsWith("app.");
  
  const { pathname } = url;

  // public/static files bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/health") // Always allow health checks
  ) {
    return NextResponse.next();
  }

  // Handle subdomain routing
  if (isAppSubdomain) {
    if (!isSessionValid(request)) {
       // If trying to access a protected route without session
       // Redirect to login (on the same subdomain)
       if (!PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
           const loginUrl = new URL("/login", request.url);
           loginUrl.searchParams.set("redirect", pathname);
           const response = NextResponse.redirect(loginUrl);
           response.cookies.delete(SESSION_COOKIE);
           response.cookies.delete(SESSION_EXPIRY_COOKIE);
           return response;
       }
    }
    
    // Valid session or public path on app subdomain
    // We do NOT rewrite to /(app) because route groups are transparent.
    // The file at src/app/(app)/page.tsx serves /.
    return NextResponse.next();
  } 

  // Root domain (Marketing)
  
  // Specific redirects from root to app
  if (pathname === "/login" || pathname === "/dashboard") {
       const url = request.nextUrl.clone();
       url.hostname = `app.${hostname}`;
       return NextResponse.redirect(url);
  }

  // Rewrite root / to /home to serve the marketing page (src/app/(marketing)/home/page.tsx)
  if (pathname === "/") {
      return NextResponse.rewrite(new URL("/home", request.url));
  }

  // Allow other paths on root domain to pass through (e.g. /about, if it existed)
  // But strictly, we might want to block app routes from appearing on root domain?
  // For now, let's just let them pass or rewrite to /home if not found?
  // A simple strategy is to let Next.js handle 404s for others, or just next()
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

async function getRoleFromSession(token: string): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return (payload as any).user?.roleName || null;
  } catch {
    return null;
  }
}

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
  "/compare",
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
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostname = forwardedHost || host;
  console.log("Middleware Hostname:", hostname);

  const { pathname } = url;

  // Root domain vs App Subdomain logic
  const isAppSubdomain = hostname.startsWith("app.");
  const isTunnel =
    hostname.includes(".trycloudflare.com") ||
    hostname.includes(".serveousercontent.com") ||
    hostname.includes(".pinggy.link") ||
    hostname.includes(".loca.lt");
  const isLocalhost =
    hostname.startsWith("localhost:") || hostname === "localhost";

  // Marketing paths that should be served from the root domain
  const MARKETING_PATHS = [
    "/",
    "/features",
    "/pricing",
    "/deploy",
    "/enterprise",
    "/architecture",
  ];
  const isMarketingPath = MARKETING_PATHS.includes(pathname);

  // Consider it "App Context" if:
  // 1. We're on the app. subdomain
  // 2. We're on a tunnel AND it's not a marketing path
  // 3. We're on localhost AND it's not a marketing path (for E2E tests)
  const isAppContext =
    isAppSubdomain ||
    (isTunnel && !isMarketingPath) ||
    (isLocalhost && !isMarketingPath);

  // public/static files bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/health") // Always allow health checks
  ) {
    return NextResponse.next();
  }

  // Handle application routing (Dashboard, Login, Maintenance, etc.)
  if (isAppContext) {
    const hasValidSession = isSessionValid(request);

    // If on app subdomain, / redirects to /dashboard (or /login)
    // If on tunnel, we're only in this block if pathname !== "/" (due to isAppContext logic)
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/dashboard"
    ) {
      if (hasValidSession) {
        let targetPath = "/dashboard";
        const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

        if (sessionToken) {
          const role = await getRoleFromSession(sessionToken);
          if (role === "admin") {
            targetPath = "/analytics";
          }
        }

        if (pathname !== targetPath) {
          return NextResponse.redirect(new URL(targetPath, request.url));
        }
      } else if (pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    if (!hasValidSession) {
      if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(SESSION_COOKIE);
        response.cookies.delete(SESSION_EXPIRY_COOKIE);
        return response;
      }
    }

    return NextResponse.next();
  }

  // Marketing Context (isAppContext is false)
  // Only handle redirects if accessed via standard localhost root
  if (
    !isTunnel &&
    !isLocalhost &&
    (pathname === "/login" || pathname === "/dashboard")
  ) {
    const appUrl = request.nextUrl.clone();
    appUrl.hostname = `app.${hostname.split(":")[0]}`;
    if (hostname.includes(":")) {
      appUrl.port = hostname.split(":")[1];
    }
    return NextResponse.redirect(appUrl);
  }

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

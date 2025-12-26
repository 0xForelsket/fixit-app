import type { UserRole } from "@/db/schema";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionUser {
  id: number;
  employeeId: string;
  name: string;
  role: UserRole;
  hourlyRate?: number | null;
}

export interface SessionPayload {
  user: SessionUser;
  expiresAt: number;
  csrfToken: string;
}

const SESSION_COOKIE_NAME = "fixit_session";
const CSRF_COOKIE_NAME = "fixit_csrf";
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// Get secret key for signing - must be at least 32 bytes for HS256
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set and at least 32 characters. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}

// Generate a random CSRF token
function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Create a signed JWT session token
async function encodeSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt / 1000))
    .sign(getSecretKey());
}

// Verify and decode a JWT session token
async function decodeSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<string> {
  const csrfToken = generateCsrfToken();
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

  const session: SessionPayload = {
    user,
    expiresAt,
    csrfToken,
  };

  const token = await encodeSession(session);
  const cookieStore = await cookies();

  // Set session cookie (httpOnly - not accessible via JS)
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  // Set CSRF cookie (readable by JS for including in requests)
  cookieStore.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // JS needs to read this
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return csrfToken;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const session = await decodeSession(sessionCookie.value);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(CSRF_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(minRole: UserRole): Promise<SessionUser> {
  const user = await requireAuth();
  const roleHierarchy: Record<UserRole, number> = {
    operator: 1,
    tech: 2,
    admin: 3,
  };

  if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
    throw new Error("Forbidden");
  }

  return user;
}

// Verify CSRF token for mutating requests
export async function verifyCsrfToken(token: string): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }
  return session.csrfToken === token;
}

// Middleware helper to verify CSRF for API routes
export async function requireCsrf(request: Request): Promise<void> {
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!csrfHeader) {
    throw new Error("CSRF token missing");
  }

  const isValid = await verifyCsrfToken(csrfHeader);
  if (!isValid) {
    throw new Error("CSRF token invalid");
  }
}

// Refresh session if it's close to expiring (within 1 hour)
export async function refreshSessionIfNeeded(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const oneHour = 60 * 60 * 1000;
  if (session.expiresAt - Date.now() < oneHour) {
    await createSession(session.user);
  }
}

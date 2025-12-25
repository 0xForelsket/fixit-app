import type { UserRole } from "@/db/schema";
import bcrypt from "bcryptjs";

// Password/PIN hashing
const SALT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// Session configuration
export const SESSION_CONFIG = {
  maxAge: Number(process.env.SESSION_MAX_AGE) || 86400, // 24 hours
  idleTimeout: 28800, // 8 hours
  cookieName: "fixit_session",
};

// Brute force protection configuration
export const BRUTE_FORCE_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in ms
};

// Check if account is locked
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

// Calculate lockout end time
export function calculateLockoutEnd(): Date {
  return new Date(Date.now() + BRUTE_FORCE_CONFIG.lockoutDuration);
}

// Role hierarchy for authorization
const ROLE_HIERARCHY: Record<UserRole, number> = {
  operator: 1,
  tech: 2,
  admin: 3,
};

// Check if user has required role level
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user can access based on minimum role
export function canAccess(userRole: UserRole, minRole: UserRole): boolean {
  return hasRole(userRole, minRole);
}

// Route protection levels
export const ROUTE_PROTECTION: Record<string, UserRole> = {
  "/report": "operator",
  "/dashboard": "tech",
  "/admin": "admin",
};

// Get required role for a path
export function getRequiredRole(pathname: string): UserRole | null {
  for (const [route, role] of Object.entries(ROUTE_PROTECTION)) {
    if (pathname.startsWith(route)) {
      return role;
    }
  }
  return null;
}

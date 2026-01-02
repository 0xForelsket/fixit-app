// Native Bun.password is used instead of bcryptjs

import {
  PERMISSIONS,
  type Permission,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
} from "./permissions";
import { type SessionUser, getCurrentUser } from "./session";

export async function hashPin(pin: string): Promise<string> {
  return Bun.password.hash(pin, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return Bun.password.verify(pin, hash);
}

export const SESSION_CONFIG = {
  maxAge: Number(process.env.SESSION_MAX_AGE) || 86400,
  idleTimeout: 28800,
  cookieName: "fixit_session",
};

export const BRUTE_FORCE_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000,
};

export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

export function calculateLockoutEnd(): Date {
  return new Date(Date.now() + BRUTE_FORCE_CONFIG.lockoutDuration);
}

export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!checkPermission(user.permissions, permission)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAnyPermission(
  permissions: Permission[]
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!checkAnyPermission(user.permissions, permissions)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function userHasPermission(
  user: SessionUser,
  permission: Permission
): boolean {
  return checkPermission(user.permissions, permission);
}

export function userHasAnyPermission(
  user: SessionUser,
  permissions: Permission[]
): boolean {
  return checkAnyPermission(user.permissions, permissions);
}

export { PERMISSIONS, type Permission };

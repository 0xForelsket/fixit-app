import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { verifyPin } from "@/lib/auth";
import { authLogger } from "@/lib/logger";
import { type LegacyRole, getLegacyRolePermissions } from "@/lib/permissions";
import { type SessionUser, createSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export type AuthResult =
  | { success: true; user: SessionUser; csrfToken: string }
  | { success: false; error: string; status?: number };

export async function authenticateUser(
  employeeId: string,
  pin: string
): Promise<AuthResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  });

  if (!user) {
    return { success: false, error: "Invalid employee ID or PIN", status: 401 };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: "Account is disabled. Please contact an administrator.",
      status: 403,
    };
  }

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    authLogger.warn(
      { employeeId, minutesLeft },
      "Login attempt on locked account"
    );
    return {
      success: false,
      error: `Account is locked. Try again in ${minutesLeft} minute(s).`,
      status: 403,
    };
  }

  const isValid = await verifyPin(pin, user.pin);

  if (!isValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const lockout = newAttempts >= 5 ? new Date(Date.now() + 15 * 60000) : null;

    await db
      .update(users)
      .set({
        failedLoginAttempts: newAttempts,
        lockedUntil: lockout,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    if (lockout) {
      authLogger.warn(
        { employeeId, attempts: newAttempts },
        "Account locked due to failed attempts"
      );
      return {
        success: false,
        error: "Too many failed attempts. Account locked for 15 minutes.",
        status: 403,
      };
    }

    authLogger.info(
      { employeeId, attempts: newAttempts },
      "Failed login attempt"
    );
    return { success: false, error: "Invalid employee ID or PIN", status: 401 };
  }

  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  let permissions: string[] = [];
  let roleName = "operator";

  if (user.roleId) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, user.roleId),
    });
    if (role) {
      roleName = role.name;
      if (role.permissions) {
        permissions = role.permissions;
      }
    }
  }

  // Fallback for permissions if role has none
  if (permissions.length === 0) {
    permissions = getLegacyRolePermissions(roleName as LegacyRole);
  }

  const sessionUser: SessionUser = {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    role: roleName as any, // Cast to any to satisfy UserRole enum temporarily
    roleId: user.roleId,
    permissions,
    hourlyRate: user.hourlyRate,
  };

  authLogger.info({ employeeId, role: roleName }, "Successful login");
  const csrfToken = await createSession(sessionUser);

  return { success: true, user: sessionUser, csrfToken };
}

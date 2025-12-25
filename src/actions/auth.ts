"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPin } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    employeeId: formData.get("employeeId"),
    pin: formData.get("pin"),
  };

  // Validate input
  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid employee ID or PIN format" };
  }

  const { employeeId, pin } = result.data;

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
  });

  if (!user) {
    return { error: "Invalid employee ID or PIN" };
  }

  // Check if user is active
  if (!user.isActive) {
    return { error: "Account is disabled. Please contact an administrator." };
  }

  // Check if account is locked
  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    return {
      error: `Account is locked. Try again in ${minutesLeft} minute(s).`,
    };
  }

  // Verify PIN
  const isValid = await verifyPin(pin, user.pin);

  if (!isValid) {
    // Increment failed attempts
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
      return {
        error: "Too many failed attempts. Account locked for 15 minutes.",
      };
    }

    return { error: "Invalid employee ID or PIN" };
  }

  // Reset failed attempts on successful login
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Create session
  await createSession({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    role: user.role,
  });

  // Redirect based on role
  if (user.role === "operator") {
    redirect("/");
  } else {
    // Tech and Admin both go to dashboard
    redirect("/dashboard");
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

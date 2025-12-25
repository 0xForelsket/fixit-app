import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPin } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, pin } = result.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.employeeId, employeeId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid employee ID or PIN" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is disabled. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          error: `Account is locked. Try again in ${minutesLeft} minute(s).`,
        },
        { status: 403 }
      );
    }

    // Verify PIN
    const isValid = await verifyPin(pin, user.pin);

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const lockout =
        newAttempts >= 5 ? new Date(Date.now() + 15 * 60000) : null;

      await db
        .update(users)
        .set({
          failedLoginAttempts: newAttempts,
          lockedUntil: lockout,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      if (lockout) {
        return NextResponse.json(
          { error: "Too many failed attempts. Account locked for 15 minutes." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: "Invalid employee ID or PIN" },
        { status: 401 }
      );
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

    // Create session (returns CSRF token)
    const csrfToken = await createSession({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      csrfToken,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

"use server";

import { DEFAULT_PREFERENCES } from "@/data/profile";
import { db } from "@/db";
import { type UserPreferences, users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { hashPin, verifyPin } from "@/lib/auth";
import { deleteSession, getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

const changePinSchema = z
  .object({
    currentPin: z.string().min(4, "PIN must be at least 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
    newPin: z.string().min(6, "New PIN must be at least 6 digits").regex(/^\d+$/, "PIN must contain only digits"),
    confirmPin: z.string().min(6, "PIN must be at least 6 digits").regex(/^\d+$/, "PIN must contain only digits"),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "New PINs don't match",
    path: ["confirmPin"],
  });

const updatePreferencesSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  density: z.enum(["compact", "comfortable"]),
  notifications: z.object({
    email: z.boolean(),
  }),
});

/**
 * Update the current user's profile (name and email)
 */
export async function updateProfile(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to update your profile",
    };
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email") || "",
  };

  const result = updateProfileSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    await db
      .update(users)
      .set({
        name: result.data.name,
        email: result.data.email || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logAudit({
      entityType: "user",
      entityId: user.id,
      action: "UPDATE",
      details: { name: result.data.name, email: result.data.email },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/settings");

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    };
  }
}

/**
 * Change the current user's PIN
 */
export async function changePin(
  _prevState: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return {
      success: false,
      error: "You must be logged in to change your PIN",
    };
  }

  const rawData = {
    currentPin: formData.get("currentPin"),
    newPin: formData.get("newPin"),
    confirmPin: formData.get("confirmPin"),
  };

  const result = changePinSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    // Fetch user with current PIN hash and session version
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, sessionUser.id),
      columns: { pin: true, sessionVersion: true },
    });

    if (!userRecord) {
      return { success: false, error: "User not found" };
    }

    // Verify current PIN
    const isValidPin = await verifyPin(result.data.currentPin, userRecord.pin);
    if (!isValidPin) {
      return { success: false, error: "Current PIN is incorrect" };
    }

    // Hash and save new PIN, increment sessionVersion to invalidate all existing sessions
    const newPinHash = await hashPin(result.data.newPin);
    const newSessionVersion = (userRecord.sessionVersion ?? 1) + 1;
    await db
      .update(users)
      .set({
        pin: newPinHash,
        sessionVersion: newSessionVersion,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sessionUser.id));

    await logAudit({
      entityType: "user",
      entityId: sessionUser.id,
      action: "UPDATE",
      details: { field: "pin" },
    });

    revalidatePath("/profile/settings");

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to change PIN:", error);
    return { success: false, error: "Failed to change PIN. Please try again." };
  }
}

/**
 * Update user preferences (theme, density, notifications)
 */
export async function updatePreferences(
  preferences: Partial<UserPreferences>
): Promise<ActionResult<UserPreferences>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to update preferences",
    };
  }

  try {
    // Fetch current preferences
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { preferences: true },
    });

    // Merge with existing preferences (or defaults)
    const currentPrefs = userRecord?.preferences ?? DEFAULT_PREFERENCES;
    const newPrefs: UserPreferences = {
      ...currentPrefs,
      ...preferences,
      notifications: {
        ...currentPrefs.notifications,
        ...preferences.notifications,
      },
    };

    // Validate merged preferences
    const result = updatePreferencesSchema.safeParse(newPrefs);
    if (!result.success) {
      return { success: false, error: "Invalid preferences" };
    }

    // Save to database
    await db
      .update(users)
      .set({
        preferences: result.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logAudit({
      entityType: "user",
      entityId: user.id,
      action: "UPDATE",
      details: { field: "preferences", ...result.data },
    });

    revalidatePath("/profile/settings");
    revalidatePath("/");

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return {
      success: false,
      error: "Failed to update preferences. Please try again.",
    };
  }
}

/**
 * Revoke all sessions for the current user (logout everywhere)
 */
export async function revokeAllSessions(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Increment session version to invalidate all active JWTs globally
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { sessionVersion: true },
    });

    const newVersion = (userRecord?.sessionVersion ?? 1) + 1;

    await db
      .update(users)
      .set({
        sessionVersion: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logAudit({
      entityType: "user",
      entityId: user.id,
      action: "LOGOUT_ALL",
      details: { reason: "User requested global session revocation" },
    });

    // Clear local session cookies
    await deleteSession();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to revoke sessions:", error);
    return {
      success: false,
      error: "Failed to revoke sessions. Please try again.",
    };
  }
}

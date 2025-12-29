"use server";

import { db } from "@/db";
import { users, type UserPreferences } from "@/db/schema";
import { hashPin, verifyPin } from "@/lib/auth";
import { getCurrentUser, deleteSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Default preferences for new users or when null
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  density: "comfortable",
  notifications: {
    email: true,
  },
};

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

const changePinSchema = z.object({
  currentPin: z.string().length(4, "PIN must be 4 digits"),
  newPin: z.string().length(4, "PIN must be 4 digits"),
  confirmPin: z.string().length(4, "PIN must be 4 digits"),
}).refine((data) => data.newPin === data.confirmPin, {
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
    return { success: false, error: "You must be logged in to update your profile" };
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

    revalidatePath("/profile");
    revalidatePath("/profile/settings");

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile. Please try again." };
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
    return { success: false, error: "You must be logged in to change your PIN" };
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
    // Fetch user with current PIN hash
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, sessionUser.id),
      columns: { pin: true },
    });

    if (!userRecord) {
      return { success: false, error: "User not found" };
    }

    // Verify current PIN
    const isValidPin = await verifyPin(result.data.currentPin, userRecord.pin);
    if (!isValidPin) {
      return { success: false, error: "Current PIN is incorrect" };
    }

    // Hash and save new PIN
    const newPinHash = await hashPin(result.data.newPin);
    await db
      .update(users)
      .set({
        pin: newPinHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sessionUser.id));

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
    return { success: false, error: "You must be logged in to update preferences" };
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

    revalidatePath("/profile/settings");
    revalidatePath("/");

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return { success: false, error: "Failed to update preferences. Please try again." };
  }
}

/**
 * Get current user's preferences (with defaults if null)
 */
export async function getPreferences(): Promise<UserPreferences> {
  const user = await getCurrentUser();
  if (!user) {
    return DEFAULT_PREFERENCES;
  }

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { preferences: true },
  });

  return userRecord?.preferences ?? DEFAULT_PREFERENCES;
}

/**
 * Revoke all sessions for the current user (logout everywhere)
 * For now this just logs out the current session.
 * A full implementation would require session tracking in the database.
 */
export async function revokeAllSessions(): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    // Currently we only have cookie-based sessions without server-side tracking
    // This will log out the current session. A full implementation would:
    // 1. Track session tokens in a database table
    // 2. Delete all tokens for this user
    // 3. Optionally keep the current session active
    await deleteSession();

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to revoke sessions:", error);
    return { success: false, error: "Failed to revoke sessions. Please try again." };
  }
}

/**
 * Get current user's full profile data
 */
export async function getProfileData() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return null;
  }

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
    columns: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      preferences: true,
      createdAt: true,
    },
    with: {
      assignedRole: {
        columns: { name: true },
      },
      department: {
        columns: { name: true },
      },
    },
  });

  if (!userRecord) {
    return null;
  }

  return {
    ...userRecord,
    preferences: userRecord.preferences ?? DEFAULT_PREFERENCES,
    roleName: userRecord.assignedRole?.name ?? "Unknown",
    departmentName: userRecord.department?.name ?? null,
  };
}

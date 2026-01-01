"use server";

import { db } from "@/db";
import { systemSettings, type SystemSettingsConfig } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Default settings values
export const DEFAULT_SETTINGS: SystemSettingsConfig = {
  sla: {
    critical: 2,
    high: 8,
    medium: 24,
    low: 72,
  },
  session: {
    idleTimeout: 8,
    maxDuration: 24,
  },
  notifications: {
    emailEnabled: false,
    escalationAlerts: true,
    dailySummary: false,
  },
};

/**
 * Get a specific system setting by key
 */
export async function getSystemSetting<K extends keyof SystemSettingsConfig>(
  key: K
): Promise<SystemSettingsConfig[K]> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });

  if (setting && setting.value) {
    return setting.value as SystemSettingsConfig[K];
  }

  return DEFAULT_SETTINGS[key];
}

/**
 * Get all system settings
 */
export async function getAllSystemSettings(): Promise<SystemSettingsConfig> {
  const settings = await db.query.systemSettings.findMany();

  const result: SystemSettingsConfig = { ...DEFAULT_SETTINGS };

  for (const setting of settings) {
    if (setting.key === "sla" && setting.value) {
      result.sla = setting.value as SystemSettingsConfig["sla"];
    } else if (setting.key === "session" && setting.value) {
      result.session = setting.value as SystemSettingsConfig["session"];
    } else if (setting.key === "notifications" && setting.value) {
      result.notifications = setting.value as SystemSettingsConfig["notifications"];
    }
  }

  return result;
}

/**
 * Update a specific system setting
 */
export async function updateSystemSetting<K extends keyof SystemSettingsConfig>(
  key: K,
  value: SystemSettingsConfig[K]
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return { success: false, error: "You don't have permission to update settings" };
  }

  try {
    // Upsert the setting
    await db
      .insert(systemSettings)
      .values({
        key,
        value,
        updatedById: user.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          updatedById: user.id,
          updatedAt: new Date(),
        },
      });

    // Audit log
    await logAudit({
      entityType: "user",
      entityId: key,
      action: "UPDATE",
      details: {
        settingKey: key,
        settingValue: value as Record<string, unknown>,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update system setting:", error);
    return { success: false, error: "Failed to update setting" };
  }
}

/**
 * Update all system settings at once
 */
export async function updateAllSystemSettings(
  settings: SystemSettingsConfig
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return { success: false, error: "You don't have permission to update settings" };
  }

  try {
    // Update all settings in a transaction
    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        await tx
          .insert(systemSettings)
          .values({
            key,
            value,
            updatedById: user.id,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value,
              updatedById: user.id,
              updatedAt: new Date(),
            },
          });
      }
    });

    // Audit log
    await logAudit({
      entityType: "user",
      entityId: "all_settings",
      action: "UPDATE",
      details: { settings: settings as unknown as Record<string, unknown> },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update system settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

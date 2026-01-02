"use server";

import { db } from "@/db";
import {
  type ReportFrequency,
  type ReportSchedule,
  reportSchedules,
  reportTemplates,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { validateEmails } from "@/lib/email";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunAt(
  frequency: ReportFrequency,
  fromDate: Date = new Date()
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  // Set to 8 AM
  next.setHours(8, 0, 0, 0);

  return next;
}

/**
 * Get all schedules for a template
 */
export async function getSchedulesForTemplate(
  templateId: string
): Promise<ActionResult<ReportSchedule[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const schedules = await db.query.reportSchedules.findMany({
    where: eq(reportSchedules.templateId, templateId),
  });

  return { success: true, data: schedules };
}

/**
 * Get a single schedule
 */
export async function getSchedule(
  id: string
): Promise<ActionResult<ReportSchedule>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const schedule = await db.query.reportSchedules.findFirst({
    where: eq(reportSchedules.id, id),
  });

  if (!schedule) {
    return { success: false, error: "Schedule not found" };
  }

  return { success: true, data: schedule };
}

/**
 * Create a new report schedule
 */
export async function createReportSchedule(data: {
  templateId: string;
  frequency: ReportFrequency;
  recipients: string[];
  timezone?: string;
}): Promise<ActionResult<ReportSchedule>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return {
      success: false,
      error: "You don't have permission to create schedules",
    };
  }

  // Validate template exists
  const template = await db.query.reportTemplates.findFirst({
    where: eq(reportTemplates.id, data.templateId),
  });

  if (!template) {
    return { success: false, error: "Report template not found" };
  }

  // Validate recipients
  if (data.recipients.length === 0) {
    return { success: false, error: "At least one recipient is required" };
  }

  const { valid, invalid } = validateEmails(data.recipients);
  if (invalid.length > 0) {
    return {
      success: false,
      error: `Invalid email addresses: ${invalid.join(", ")}`,
    };
  }

  try {
    const nextRunAt = calculateNextRunAt(data.frequency);

    const [schedule] = await db
      .insert(reportSchedules)
      .values({
        templateId: data.templateId,
        frequency: data.frequency,
        recipients: valid,
        timezone: data.timezone || "UTC",
        isActive: true,
        nextRunAt,
        createdById: user.id,
      })
      .returning();

    await logAudit({
      entityType: "user",
      entityId: schedule.id,
      action: "CREATE",
      details: {
        type: "report_schedule",
        templateId: data.templateId,
        frequency: data.frequency,
        recipients: valid,
      },
    });

    revalidatePath("/reports");
    revalidatePath(`/reports/builder/${data.templateId}`);

    return { success: true, data: schedule };
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return { success: false, error: "Failed to create schedule" };
  }
}

/**
 * Update a report schedule
 */
export async function updateReportSchedule(
  id: string,
  data: {
    frequency?: ReportFrequency;
    recipients?: string[];
    timezone?: string;
    isActive?: boolean;
  }
): Promise<ActionResult<ReportSchedule>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return {
      success: false,
      error: "You don't have permission to update schedules",
    };
  }

  const existing = await db.query.reportSchedules.findFirst({
    where: eq(reportSchedules.id, id),
  });

  if (!existing) {
    return { success: false, error: "Schedule not found" };
  }

  // Validate recipients if provided
  if (data.recipients !== undefined) {
    if (data.recipients.length === 0) {
      return { success: false, error: "At least one recipient is required" };
    }

    const { valid, invalid } = validateEmails(data.recipients);
    if (invalid.length > 0) {
      return {
        success: false,
        error: `Invalid email addresses: ${invalid.join(", ")}`,
      };
    }
    data.recipients = valid;
  }

  try {
    const updateData: Partial<typeof reportSchedules.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.frequency !== undefined) {
      updateData.frequency = data.frequency;
      updateData.nextRunAt = calculateNextRunAt(data.frequency);
    }
    if (data.recipients !== undefined) {
      updateData.recipients = data.recipients;
    }
    if (data.timezone !== undefined) {
      updateData.timezone = data.timezone;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const [schedule] = await db
      .update(reportSchedules)
      .set(updateData)
      .where(eq(reportSchedules.id, id))
      .returning();

    await logAudit({
      entityType: "user",
      entityId: id,
      action: "UPDATE",
      details: {
        type: "report_schedule",
        changes: data,
      },
    });

    revalidatePath("/reports");

    return { success: true, data: schedule };
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return { success: false, error: "Failed to update schedule" };
  }
}

/**
 * Delete a report schedule
 */
export async function deleteReportSchedule(
  id: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return {
      success: false,
      error: "You don't have permission to delete schedules",
    };
  }

  try {
    await db.delete(reportSchedules).where(eq(reportSchedules.id, id));

    await logAudit({
      entityType: "user",
      entityId: id,
      action: "DELETE",
      details: { type: "report_schedule" },
    });

    revalidatePath("/reports");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return { success: false, error: "Failed to delete schedule" };
  }
}

/**
 * Toggle schedule active state
 */
export async function toggleScheduleActive(
  id: string
): Promise<ActionResult<ReportSchedule>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const existing = await db.query.reportSchedules.findFirst({
    where: eq(reportSchedules.id, id),
  });

  if (!existing) {
    return { success: false, error: "Schedule not found" };
  }

  return updateReportSchedule(id, { isActive: !existing.isActive });
}

/**
 * Get all active schedules that are due
 */
export async function getDueSchedules(): Promise<ReportSchedule[]> {
  const now = new Date();

  return db.query.reportSchedules
    .findMany({
      where: and(eq(reportSchedules.isActive, true)),
    })
    .then((schedules) =>
      schedules.filter((s) => s.nextRunAt && s.nextRunAt <= now)
    );
}

/**
 * Mark schedule as run (update lastRunAt and calculate next)
 */
export async function markScheduleRun(
  id: string,
  success: boolean,
  error?: string
): Promise<void> {
  const schedule = await db.query.reportSchedules.findFirst({
    where: eq(reportSchedules.id, id),
  });

  if (!schedule) return;

  const now = new Date();

  if (success) {
    await db
      .update(reportSchedules)
      .set({
        lastRunAt: now,
        nextRunAt: calculateNextRunAt(
          schedule.frequency as ReportFrequency,
          now
        ),
        lastError: null,
        failedAt: null,
        retryCount: 0,
        updatedAt: now,
      })
      .where(eq(reportSchedules.id, id));
  } else {
    await db
      .update(reportSchedules)
      .set({
        lastError: error || "Unknown error",
        failedAt: now,
        retryCount: schedule.retryCount + 1,
        updatedAt: now,
      })
      .where(eq(reportSchedules.id, id));
  }
}

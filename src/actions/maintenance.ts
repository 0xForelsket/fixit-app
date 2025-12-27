"use server";

import { db } from "@/db";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import {
  insertMaintenanceScheduleSchema,
  updateMaintenanceScheduleSchema,
} from "@/lib/validations/schedules";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

export type ScheduleActionState = {
  error?: string;
  success?: boolean;
};

export async function createSchedule(
  _prevState: ScheduleActionState,
  _formData: FormData
): Promise<ScheduleActionState> {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.MAINTENANCE_CREATE)) {
    return { error: "Unauthorized" };
  }

  // Parse raw form data into object
  // Note: For complex nested data like checklists, FormData is tricky.
  // In our Client Component, we were sending JSON.
  // To keep using the robust Zod schema with nested arrays, we can:
  // 1. Continue using JSON but call the action directly (cleaner for nested data).
  // 2. Parse dot notation from formData (messy).
  // Let's accept the raw object as an argument instead of FormData for this specific complex form.
  // BUT, Server Actions usually take FormData if used in <form action={...}>.
  // Since we are using RHF `handleSubmit`, we can just call the action as a function with the data object.
  return { error: "Invalid call" }; // Placeholder, see actual implementation below
}

// Better approach for RHF + Server Actions with nested data:
// The action takes the data object directly.
export async function createScheduleAction(
  data: z.infer<typeof insertMaintenanceScheduleSchema>
): Promise<ScheduleActionState> {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.MAINTENANCE_CREATE)) {
    return { error: "Unauthorized" };
  }

  const validated = insertMaintenanceScheduleSchema.safeParse(data);
  if (!validated.success) {
    return { error: `Invalid data: ${validated.error.message}` };
  }

  const { title, equipmentId, type, frequencyDays, isActive, checklists } =
    validated.data;

  try {
    const nextDue = new Date(); // Due immediately for first run

    const [schedule] = await db
      .insert(maintenanceSchedules)
      .values({
        title,
        equipmentId,
        type,
        frequencyDays,
        isActive: isActive ?? true,
        nextDue,
      })
      .returning();

    if (checklists && checklists.length > 0) {
      await db.insert(maintenanceChecklists).values(
        checklists.map((item) => ({
          scheduleId: schedule.id,
          stepNumber: item.stepNumber,
          description: item.description,
          isRequired: item.isRequired,
          estimatedMinutes: item.estimatedMinutes,
        }))
      );
    }
  } catch (error) {
    console.error("Error creating schedule:", error);
    return { error: "Failed to create schedule" };
  }

  revalidatePath("/maintenance/schedules");
  redirect("/maintenance/schedules");
}

export async function updateScheduleAction(
  id: number,
  data: z.infer<typeof updateMaintenanceScheduleSchema>
): Promise<ScheduleActionState> {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.MAINTENANCE_UPDATE)) {
    return { error: "Unauthorized" };
  }

  const validated = updateMaintenanceScheduleSchema.safeParse(data);
  if (!validated.success) {
    return { error: `Invalid data: ${validated.error.message}` };
  }

  const { title, equipmentId, type, frequencyDays, isActive, checklists } =
    validated.data;

  try {
    const [schedule] = await db
      .update(maintenanceSchedules)
      .set({
        title,
        equipmentId,
        type,
        frequencyDays,
        isActive,
      })
      .where(eq(maintenanceSchedules.id, id))
      .returning();

    if (!schedule) {
      return { error: "Schedule not found" };
    }

    // Update checklists
    if (checklists) {
      await db
        .delete(maintenanceChecklists)
        .where(eq(maintenanceChecklists.scheduleId, id));

      if (checklists.length > 0) {
        await db.insert(maintenanceChecklists).values(
          checklists.map((item) => ({
            scheduleId: id,
            stepNumber: item.stepNumber,
            description: item.description,
            isRequired: item.isRequired,
            estimatedMinutes: item.estimatedMinutes,
          }))
        );
      }
    }
  } catch (error) {
    console.error("Error updating schedule:", error);
    return { error: "Failed to update schedule" };
  }

  revalidatePath("/maintenance/schedules");
  redirect("/maintenance/schedules");
}

export async function deleteScheduleAction(
  id: number
): Promise<ScheduleActionState> {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.MAINTENANCE_DELETE)) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .delete(maintenanceChecklists)
      .where(eq(maintenanceChecklists.scheduleId, id));

    const [deleted] = await db
      .delete(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, id))
      .returning();

    if (!deleted) {
      return { error: "Schedule not found" };
    }
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return { error: "Failed to delete schedule" };
  }

  revalidatePath("/maintenance/schedules");
  return { success: true };
}

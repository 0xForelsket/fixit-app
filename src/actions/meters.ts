"use server";

import { db } from "@/db";
import {
  type MeterType,
  equipment,
  equipmentMeters,
  maintenanceSchedules,
  meterReadings,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import {
  type MeterInput,
  type MeterReadingInput,
  meterReadingSchema,
  meterSchema,
} from "@/lib/validations/equipment";
import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMeters(equipmentId: string) {
  try {
    const meters = await db.query.equipmentMeters.findMany({
      where: eq(equipmentMeters.equipmentId, equipmentId),
    });
    return { success: true, data: meters };
  } catch (_error) {
    return { success: false, error: "Failed to fetch meters" };
  }
}

export async function createMeter(
  equipmentId: string,
  _prevState: unknown,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  // Check permission (reusing equipment update permission)
  if (
    !user.permissions.includes(PERMISSIONS.EQUIPMENT_UPDATE) &&
    !user.permissions.includes("*")
  ) {
    return {
      success: false,
      error: "You don't have permission to manage equipment meters",
    };
  }

  const rawData: MeterInput = {
    name: formData.get("name") as string,
    type: formData.get("type") as MeterType,
    unit: formData.get("unit") as string,
    currentReading: formData.get("currentReading")
      ? Number(formData.get("currentReading"))
      : undefined,
  };

  const validation = meterSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  try {
    const data = validation.data;

    await db.insert(equipmentMeters).values({
      equipmentId,
      name: data.name,
      type: data.type,
      unit: data.unit,
      currentReading: data.currentReading?.toString() || "0",
      lastReadingDate: data.currentReading ? new Date() : null,
    });

    revalidatePath("/assets/equipment");
    return { success: true };
  } catch (error) {
    console.error("Error creating meter:", error);
    return { success: false, error: "Failed to create meter" };
  }
}

export async function recordReading(_prevState: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  // Check permission
  if (
    !user.permissions.includes(PERMISSIONS.EQUIPMENT_UPDATE) &&
    !user.permissions.includes(PERMISSIONS.EQUIPMENT_METERS_RECORD) &&
    !user.permissions.includes("*")
  ) {
    return {
      success: false,
      error: "You don't have permission to record readings",
    };
  }

  const rawData: MeterReadingInput = {
    meterId: formData.get("meterId") as string,
    reading: Number(formData.get("reading")),
    notes: (formData.get("notes") as string) || undefined,
    workOrderId: (formData.get("workOrderId") as string) || undefined,
  };

  const validation = meterReadingSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    };
  }

  try {
    const data = validation.data;
    let recordedReadingId: string | null = null;

    await db.transaction(async (tx) => {
      // 1. Record the reading history
      const [inserted] = await tx
        .insert(meterReadings)
        .values({
          meterId: data.meterId,
          reading: data.reading.toString(),
          notes: data.notes,
          workOrderId: data.workOrderId,
          recordedById: user.id,
        })
        .returning();

      recordedReadingId = inserted.id;

      // 2. Update the meter's current reading
      await tx
        .update(equipmentMeters)
        .set({
          currentReading: data.reading.toString(),
          lastReadingDate: new Date(),
        })
        .where(eq(equipmentMeters.id, data.meterId));

      // 3. Check usage-based maintenance schedules (Phase 4.2)
      const schedules = await tx
        .select()
        .from(maintenanceSchedules)
        .where(
          and(
            eq(maintenanceSchedules.meterId, data.meterId),
            eq(maintenanceSchedules.isActive, true),
            isNotNull(maintenanceSchedules.meterInterval)
          )
        );

      for (const schedule of schedules) {
        if (!schedule.meterInterval) continue;

        const lastTrigger = Number(schedule.lastTriggerReading || "0");
        const current = data.reading;

        if (current - lastTrigger >= schedule.meterInterval) {
          // Trigger Maintenance
          const dueBy = calculateDueBy("medium"); // Default priority

          // Get equipment to check for department
          const [eqItem] = await tx
            .select({ departmentId: equipment.departmentId })
            .from(equipment)
            .where(eq(equipment.id, schedule.equipmentId))
            .limit(1);

          await tx
            .insert(workOrders)
            .values({
              equipmentId: schedule.equipmentId,
              type: "maintenance",
              title: `Usage-Based: ${schedule.title}`,
              description: `Generated by meter trigger. Reading: ${current} (Interval: ${schedule.meterInterval})`,
              priority: "medium", // Could make this configurable in schedule
              reportedById: user.id, // System generated, but attributed to recorder? Or create a system user?
              // For now, attribute to the person recording the reading.
              departmentId: eqItem?.departmentId,
              status: "open",
              dueBy,
            })
            .returning();

          // Update Schedule
          await tx
            .update(maintenanceSchedules)
            .set({
              lastTriggerReading: current.toString(),
              lastGenerated: new Date(),
            })
            .where(eq(maintenanceSchedules.id, schedule.id));
        }
      }
    });

    // 4. Check for anomalies (Phase 7)
    if (recordedReadingId) {
      const { checkAndRecordAnomaly } = await import("@/actions/predictions");
      await checkAndRecordAnomaly(
        data.meterId,
        recordedReadingId,
        data.reading,
        user.id
      );
    }

    revalidatePath("/assets/equipment");
    revalidatePath("/maintenance/work-orders"); // Update WO list
    return { success: true };
  } catch (error) {
    console.error("Error recording reading:", error);
    return { success: false, error: "Failed to record reading" };
  }
}

export async function deleteMeter(meterId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (
    !user.permissions.includes(PERMISSIONS.EQUIPMENT_UPDATE) &&
    !user.permissions.includes("*")
  ) {
    return {
      success: false,
      error: "You don't have permission to delete meters",
    };
  }

  try {
    await db.delete(equipmentMeters).where(eq(equipmentMeters.id, meterId));
    revalidatePath("/assets/equipment");
    return { success: true };
  } catch (error) {
    console.error("Error deleting meter:", error);
    return { success: false, error: "Failed to delete meter" };
  }
}

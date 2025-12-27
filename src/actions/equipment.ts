"use server";

import { db } from "@/db";
import { equipmentStatusLogs, equipment as equipmentTable } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export async function createEquipment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.EQUIPMENT_CREATE)) {
    return { error: "You don't have permission to create equipment" };
  }

  const rawData = {
    name: formData.get("name"),
    code: formData.get("code")?.toString().toUpperCase(),
    locationId: Number(formData.get("locationId")),
    ownerId: formData.get("ownerId") ? Number(formData.get("ownerId")) : null,
    typeId: formData.get("typeId") ? Number(formData.get("typeId")) : null,
    status: formData.get("status") || "operational",
  };

  const result = createEquipmentSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { error: firstError || "Invalid input" };
  }

  try {
    const [newItem] = await db
      .insert(equipmentTable)
      .values(result.data)
      .returning();

    revalidatePath("/assets/equipment");
    return { success: true, data: newItem };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { error: "A equipment with this code already exists" };
    }
    return { error: "Failed to create equipment" };
  }
}

export async function updateEquipment(
  equipmentId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.EQUIPMENT_UPDATE)) {
    return { error: "You don't have permission to update equipment" };
  }

  const existingEquipment = await db.query.equipment.findFirst({
    where: eq(equipmentTable.id, equipmentId),
  });

  if (!existingEquipment) {
    return { error: "Equipment not found" };
  }

  const rawData: Record<string, unknown> = {};
  const name = formData.get("name");
  const code = formData.get("code");
  const locationId = formData.get("locationId");
  const ownerId = formData.get("ownerId");
  const typeId = formData.get("typeId");
  const status = formData.get("status");

  if (name) rawData.name = name;
  if (code) rawData.code = code.toString().toUpperCase();
  if (locationId) rawData.locationId = Number(locationId);
  if (ownerId !== null) {
    rawData.ownerId = ownerId ? Number(ownerId) : null;
  }
  if (typeId !== null) {
    rawData.typeId = typeId ? Number(typeId) : null;
  }
  if (status) rawData.status = status;

  const result = updateEquipmentSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid input" };
  }

  // Log status change if status is being updated
  if (result.data.status && result.data.status !== existingEquipment.status) {
    await db.insert(equipmentStatusLogs).values({
      equipmentId,
      oldStatus: existingEquipment.status,
      newStatus: result.data.status,
      changedById: user.id,
    });
  }

  try {
    await db
      .update(equipmentTable)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(equipmentTable.id, equipmentId));

    revalidatePath("/assets/equipment");
    revalidatePath(`/assets/equipment/${equipmentId}`);
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { error: "A equipment with this code already exists" };
    }
    return { error: "Failed to update equipment" };
  }
}

export async function deleteEquipment(
  equipmentId: number
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.EQUIPMENT_DELETE)) {
    return { error: "You don't have permission to delete equipment" };
  }

  // Check if equipment has any work orders
  const equipmentWithWorkOrders = await db.query.equipment.findFirst({
    where: eq(equipmentTable.id, equipmentId),
    with: {
      workOrders: {
        limit: 1,
      },
    },
  });

  if (!equipmentWithWorkOrders) {
    return { error: "Equipment not found" };
  }

  if (equipmentWithWorkOrders.workOrders.length > 0) {
    return { error: "Cannot delete equipment with existing work orders" };
  }

  await db.delete(equipmentTable).where(eq(equipmentTable.id, equipmentId));

  revalidatePath("/assets/equipment");
  return { success: true };
}

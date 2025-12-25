"use server";

import { db } from "@/db";
import { machineStatusLogs, machines } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { createMachineSchema, updateMachineSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export async function createMachine(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (user.role !== "admin") {
    return { error: "Only administrators can create machines" };
  }

  const rawData = {
    name: formData.get("name"),
    code: formData.get("code")?.toString().toUpperCase(),
    locationId: Number(formData.get("locationId")),
    ownerId: formData.get("ownerId") ? Number(formData.get("ownerId")) : null,
    status: formData.get("status") || "operational",
  };

  const result = createMachineSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { error: firstError || "Invalid input" };
  }

  try {
    const [machine] = await db.insert(machines).values(result.data).returning();

    revalidatePath("/admin/machines");
    return { success: true, data: machine };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { error: "A machine with this code already exists" };
    }
    return { error: "Failed to create machine" };
  }
}

export async function updateMachine(
  machineId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (user.role !== "admin") {
    return { error: "Only administrators can update machines" };
  }

  const existingMachine = await db.query.machines.findFirst({
    where: eq(machines.id, machineId),
  });

  if (!existingMachine) {
    return { error: "Machine not found" };
  }

  const rawData: Record<string, unknown> = {};
  const name = formData.get("name");
  const code = formData.get("code");
  const locationId = formData.get("locationId");
  const ownerId = formData.get("ownerId");
  const status = formData.get("status");

  if (name) rawData.name = name;
  if (code) rawData.code = code.toString().toUpperCase();
  if (locationId) rawData.locationId = Number(locationId);
  if (ownerId !== null) {
    rawData.ownerId = ownerId ? Number(ownerId) : null;
  }
  if (status) rawData.status = status;

  const result = updateMachineSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid input" };
  }

  // Log status change if status is being updated
  if (result.data.status && result.data.status !== existingMachine.status) {
    await db.insert(machineStatusLogs).values({
      machineId,
      oldStatus: existingMachine.status,
      newStatus: result.data.status,
      changedById: user.id,
    });
  }

  try {
    await db
      .update(machines)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(machines.id, machineId));

    revalidatePath("/admin/machines");
    revalidatePath(`/admin/machines/${machineId}`);
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { error: "A machine with this code already exists" };
    }
    return { error: "Failed to update machine" };
  }
}

export async function deleteMachine(machineId: number): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (user.role !== "admin") {
    return { error: "Only administrators can delete machines" };
  }

  // Check if machine has any tickets
  const machineWithTickets = await db.query.machines.findFirst({
    where: eq(machines.id, machineId),
    with: {
      tickets: {
        limit: 1,
      },
    },
  });

  if (!machineWithTickets) {
    return { error: "Machine not found" };
  }

  if (machineWithTickets.tickets.length > 0) {
    return { error: "Cannot delete machine with existing tickets" };
  }

  await db.delete(machines).where(eq(machines.id, machineId));

  revalidatePath("/admin/machines");
  return { success: true };
}

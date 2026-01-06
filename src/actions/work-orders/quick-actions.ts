"use server";

import { db, eq, workOrderLogs, workOrders } from "./shared";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { revalidatePath } from "next/cache";

/**
 * Assign a work order to the current user
 */
export async function assignToMe(
  workOrderId: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_ASSIGN)) {
    return {
      success: false,
      error: "You don't have permission to assign work orders",
    };
  }

  const existingWorkOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!existingWorkOrder) {
    return { success: false, error: "Work order not found" };
  }

  if (existingWorkOrder.assignedToId === user.id) {
    return { success: false, error: "Already assigned to you" };
  }

  await db
    .update(workOrders)
    .set({ assignedToId: user.id, updatedAt: new Date() })
    .where(eq(workOrders.id, workOrderId));

  await db.insert(workOrderLogs).values({
    workOrderId,
    action: "assignment",
    oldValue: existingWorkOrder.assignedToId || "unassigned",
    newValue: user.id,
    createdById: user.id,
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Start working on a work order (sets status to in_progress and assigns if unassigned)
 */
export async function startWorkOrder(
  workOrderId: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_UPDATE)) {
    return {
      success: false,
      error: "You don't have permission to update work orders",
    };
  }

  const existingWorkOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!existingWorkOrder) {
    return { success: false, error: "Work order not found" };
  }

  if (
    existingWorkOrder.status === "resolved" ||
    existingWorkOrder.status === "closed"
  ) {
    return {
      success: false,
      error: "Cannot start a resolved or closed work order",
    };
  }

  const updateData: Record<string, unknown> = {
    status: "in_progress",
    updatedAt: new Date(),
  };

  // Auto-assign to current user if not assigned
  if (!existingWorkOrder.assignedToId) {
    updateData.assignedToId = user.id;
  }

  await db
    .update(workOrders)
    .set(updateData)
    .where(eq(workOrders.id, workOrderId));

  // Log status change
  if (existingWorkOrder.status !== "in_progress") {
    await db.insert(workOrderLogs).values({
      workOrderId,
      action: "status_change",
      oldValue: existingWorkOrder.status,
      newValue: "in_progress",
      createdById: user.id,
    });
  }

  // Log assignment if it changed
  if (!existingWorkOrder.assignedToId) {
    await db.insert(workOrderLogs).values({
      workOrderId,
      action: "assignment",
      oldValue: "unassigned",
      newValue: user.id,
      createdById: user.id,
    });
  }

  // Notify reporter
  if (existingWorkOrder.reportedById !== user.id) {
    await createNotification({
      userId: existingWorkOrder.reportedById,
      type: "work_order_status_changed",
      title: "Work Order In Progress",
      message: existingWorkOrder.title,
      link: `/maintenance/work-orders/${workOrderId}`,
    });
  }

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Quick resolve a work order with a default resolution note
 */
export async function quickResolveWorkOrder(
  workOrderId: string,
  resolutionNotes?: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_RESOLVE)) {
    return {
      success: false,
      error: "You don't have permission to resolve work orders",
    };
  }

  const existingWorkOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!existingWorkOrder) {
    return { success: false, error: "Work order not found" };
  }

  if (
    existingWorkOrder.status === "resolved" ||
    existingWorkOrder.status === "closed"
  ) {
    return {
      success: false,
      error: "Work order is already resolved or closed",
    };
  }

  const notes = resolutionNotes || `Resolved by ${user.name}`;

  await db
    .update(workOrders)
    .set({
      status: "resolved",
      resolutionNotes: notes,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, workOrderId));

  await db.insert(workOrderLogs).values({
    workOrderId,
    action: "status_change",
    oldValue: existingWorkOrder.status,
    newValue: "resolved",
    createdById: user.id,
  });

  // Notify reporter
  if (existingWorkOrder.reportedById !== user.id) {
    await createNotification({
      userId: existingWorkOrder.reportedById,
      type: "work_order_resolved",
      title: "Your Work Order Has Been Resolved",
      message: existingWorkOrder.title,
      link: `/maintenance/work-orders/${workOrderId}`,
    });
  }

  await logAudit({
    entityType: "work_order",
    entityId: workOrderId,
    action: "UPDATE",
    details: {
      action: "quick_resolved",
      previousStatus: existingWorkOrder.status,
      resolutionNotes: notes,
    },
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

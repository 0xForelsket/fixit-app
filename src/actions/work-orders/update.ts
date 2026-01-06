"use server";

import { db, eq, notifications, workOrderLogs, workOrders } from "./shared";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { workOrderLogger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import {
  updateChecklistItemSchema,
  updateWorkOrderSchema,
} from "@/lib/validations";
import { checklistCompletions } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

export async function updateWorkOrder(
  workOrderId: string,
  _prevState: ActionResult<void> | undefined,
  formData: FormData
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

  const rawData: Record<string, unknown> = {};
  const status = formData.get("status");
  const priority = formData.get("priority");
  const assignedToId = formData.get("assignedToId");
  const resolutionNotes = formData.get("resolutionNotes");

  if (status) rawData.status = status;
  if (priority) rawData.priority = priority;
  if (assignedToId) rawData.assignedToId = assignedToId.toString() || null;
  if (resolutionNotes) rawData.resolutionNotes = resolutionNotes;

  const result = updateWorkOrderSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: "Invalid input" };
  }

  const existingWorkOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!existingWorkOrder) {
    return { success: false, error: "Work order not found" };
  }

  const updateData: Record<string, unknown> = {
    ...result.data,
    updatedAt: new Date(),
  };

  // Set resolvedAt if status is being changed to resolved
  if (
    result.data.status === "resolved" &&
    existingWorkOrder.status !== "resolved"
  ) {
    updateData.resolvedAt = new Date();
  }

  await db
    .update(workOrders)
    .set(updateData)
    .where(eq(workOrders.id, workOrderId));

  // Log status changes
  if (result.data.status && result.data.status !== existingWorkOrder.status) {
    await db.insert(workOrderLogs).values({
      workOrderId,
      action: "status_change",
      oldValue: existingWorkOrder.status,
      newValue: result.data.status,
      createdById: user.id,
    });

    // Notify reporter of status change (if not the one making the change)
    if (existingWorkOrder.reportedById !== user.id) {
      await createNotification({
        userId: existingWorkOrder.reportedById,
        type: "work_order_status_changed",
        title: `Work Order ${result.data.status.replace("_", " ").toUpperCase()}`,
        message: existingWorkOrder.title,
        link: `/maintenance/work-orders/${workOrderId}`,
      });
    }
  }

  // Log assignment changes
  if (
    result.data.assignedToId !== undefined &&
    result.data.assignedToId !== existingWorkOrder.assignedToId
  ) {
    await db.insert(workOrderLogs).values({
      workOrderId,
      action: "assignment",
      oldValue: existingWorkOrder.assignedToId?.toString() || null,
      newValue: result.data.assignedToId?.toString() || "unassigned",
      createdById: user.id,
    });

    // Notify newly assigned user
    if (result.data.assignedToId) {
      await db.insert(notifications).values({
        userId: result.data.assignedToId,
        type: "work_order_assigned",
        title: "Work Order Assigned to You",
        message: existingWorkOrder.title,
        link: `/maintenance/work-orders/${workOrderId}`,
      });
    }
  }

  // Audit log for work order update
  await logAudit({
    entityType: "work_order",
    entityId: workOrderId,
    action: "UPDATE",
    details: {
      changes: result.data,
      previousStatus: existingWorkOrder.status,
    },
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function addWorkOrderComment(
  workOrderId: string,
  _prevState: ActionResult<void> | undefined,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const comment = formData.get("comment")?.toString();
  if (!comment || comment.trim().length === 0) {
    return { success: false, error: "Comment is required" };
  }

  // Fetch work order to get reporter and assignee
  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!workOrder) {
    return { success: false, error: "Work order not found" };
  }

  await db.insert(workOrderLogs).values({
    workOrderId,
    action: "comment",
    oldValue: null,
    newValue: comment.trim(),
    createdById: user.id,
  });

  // Notify reporter and assignee (excluding the commenter)
  const usersToNotify = new Set<string>();
  if (workOrder.reportedById !== user.id) {
    usersToNotify.add(workOrder.reportedById);
  }
  if (workOrder.assignedToId && workOrder.assignedToId !== user.id) {
    usersToNotify.add(workOrder.assignedToId);
  }

  for (const userId of usersToNotify) {
    await createNotification({
      userId,
      type: "work_order_commented",
      title: "New Comment on Work Order",
      message: `${user.name} commented on: ${workOrder.title}`,
      link: `/maintenance/work-orders/${workOrderId}`,
    });
  }

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);

  return { success: true };
}

export async function updateChecklistItem(
  completionId: string,
  workOrderId: string,
  data: z.infer<typeof updateChecklistItemSchema>
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  const result = updateChecklistItemSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    await db
      .update(checklistCompletions)
      .set({
        status: result.data.status,
        notes: result.data.notes,
        completedById: user.id,
        completedAt: result.data.status === "completed" ? new Date() : null,
      })
      .where(eq(checklistCompletions.id, completionId));

    revalidatePath(`/maintenance/work-orders/${workOrderId}`);
    return { success: true };
  } catch (error) {
    workOrderLogger.error(
      { error, userId: user.id },
      "Failed to update checklist item"
    );
    return {
      success: false,
      error: "Failed to update item",
    };
  }
}

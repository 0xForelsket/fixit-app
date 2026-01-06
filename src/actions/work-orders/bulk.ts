"use server";

import { db, eq, inArray, notifications, workOrderLogs, workOrders } from "./shared";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { workOrderLogger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import type { ActionResult } from "@/lib/types/actions";
import { revalidatePath } from "next/cache";

export interface BulkUpdateData {
  ids: string[];
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "critical";
  assignedToId?: string | null;
}

export async function bulkUpdateWorkOrders(
  data: BulkUpdateData
): Promise<ActionResult<{ updated: number }>> {
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

  const { ids, status, priority, assignedToId } = data;

  if (!ids || ids.length === 0) {
    return { success: false, error: "No work orders selected" };
  }

  if (ids.length > 100) {
    return {
      success: false,
      error: "Maximum 100 work orders can be updated at once",
    };
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

  // Check if there's anything to update
  if (Object.keys(updateData).length === 1) {
    return { success: false, error: "No changes specified" };
  }

  try {
    // Batch fetch all existing work orders
    const existingWorkOrders = await db.query.workOrders.findMany({
      where: inArray(workOrders.id, ids),
    });

    const existingMap = new Map(existingWorkOrders.map((wo) => [wo.id, wo]));

    // Prepare batch operations
    const statusLogs: Array<{
      workOrderId: string;
      action: "status_change";
      oldValue: string;
      newValue: string;
      createdById: string;
    }> = [];

    const assignmentLogs: Array<{
      workOrderId: string;
      action: "assignment";
      oldValue: string | null;
      newValue: string;
      createdById: string;
    }> = [];

    const assignmentNotifications: Array<{
      userId: string;
      type: "work_order_assigned";
      title: string;
      message: string;
      link: string;
    }> = [];

    // Filter to only valid IDs and collect logs
    const validIds: string[] = [];
    for (const id of ids) {
      const existing = existingMap.get(id);
      if (!existing) continue;

      validIds.push(id);

      if (status && status !== existing.status) {
        statusLogs.push({
          workOrderId: id,
          action: "status_change",
          oldValue: existing.status,
          newValue: status,
          createdById: user.id,
        });
      }

      if (
        assignedToId !== undefined &&
        assignedToId !== existing.assignedToId
      ) {
        assignmentLogs.push({
          workOrderId: id,
          action: "assignment",
          oldValue: existing.assignedToId?.toString() || null,
          newValue: assignedToId?.toString() || "unassigned",
          createdById: user.id,
        });

        if (assignedToId) {
          assignmentNotifications.push({
            userId: assignedToId,
            type: "work_order_assigned",
            title: "Work Order Assigned to You",
            message: existing.title,
            link: `/maintenance/work-orders/${id}`,
          });
        }
      }
    }

    await db.transaction(async (tx) => {
      if (validIds.length > 0) {
        await tx
          .update(workOrders)
          .set(updateData)
          .where(inArray(workOrders.id, validIds));
      }

      if (statusLogs.length > 0) {
        await tx.insert(workOrderLogs).values(statusLogs);
      }

      if (assignmentLogs.length > 0) {
        await tx.insert(workOrderLogs).values(assignmentLogs);
      }

      if (assignmentNotifications.length > 0) {
        await tx.insert(notifications).values(assignmentNotifications);
      }
    });

    const updated = validIds.length;

    if (updated > 0) {
      await logAudit({
        entityType: "work_order",
        entityId: validIds[0],
        action: "BULK_UPDATE",
        details: {
          workOrderIds: validIds,
          changes: { status, priority, assignedToId },
          count: updated,
        },
      });
    }

    workOrderLogger.info(
      { userId: user.id, count: updated, action: "bulk_update" },
      "Bulk updated work orders"
    );

    revalidatePath("/maintenance/work-orders");
    revalidatePath("/dashboard");

    return { success: true, data: { updated } };
  } catch (error) {
    workOrderLogger.error(
      { error, userId: user.id },
      "Failed to bulk update work orders"
    );
    return {
      success: false,
      error: "Failed to update work orders. Please try again.",
    };
  }
}

export async function duplicateWorkOrder(
  workOrderId: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_CREATE)) {
    return {
      success: false,
      error: "You don't have permission to create work orders",
    };
  }

  try {
    const originalWorkOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: {
        equipment: true,
      },
    });

    if (!originalWorkOrder) {
      return { success: false, error: "Work order not found" };
    }

    const dueBy = calculateDueBy(originalWorkOrder.priority);

    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({
        equipmentId: originalWorkOrder.equipmentId,
        type: originalWorkOrder.type,
        title: `Copy of ${originalWorkOrder.title}`,
        description: originalWorkOrder.description,
        priority: originalWorkOrder.priority,
        reportedById: user.id,
        departmentId: originalWorkOrder.departmentId,
        status: "open",
        assignedToId: null,
        dueBy,
      })
      .returning();

    workOrderLogger.info(
      { userId: user.id, originalId: workOrderId, newId: newWorkOrder.id },
      "Duplicated work order"
    );

    revalidatePath("/dashboard");
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/my-work-orders");

    return { success: true, data: { id: newWorkOrder.id } };
  } catch (error) {
    workOrderLogger.error(
      { error, userId: user.id, workOrderId },
      "Failed to duplicate work order"
    );
    return {
      success: false,
      error: "Failed to duplicate work order. Please try again.",
    };
  }
}

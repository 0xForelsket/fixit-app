"use server";

import { db } from "@/db";
import {
  attachments,
  checklistCompletions,
  equipment as equipmentTable,
  notifications,
  roles,
  users,
  workOrderLogs,
  workOrders,
} from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { workOrderLogger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import type { ActionResult } from "@/lib/types/actions";
import { safeJsonParseOrDefault } from "@/lib/utils";
import {
  createWorkOrderSchema,
  resolveWorkOrderSchema,
  updateChecklistItemSchema,
  updateWorkOrderSchema,
} from "@/lib/validations";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

export async function createWorkOrder(
  _prevState: ActionResult<unknown> | undefined,
  formData: FormData
): Promise<ActionResult<unknown>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to create a work order",
    };
  }

  // Extract attachments from JSON if provided (using safe parsing)
  const attachmentsJson = formData.get("attachments")?.toString();
  const parsedAttachments = safeJsonParseOrDefault<unknown[]>(
    attachmentsJson,
    []
  );

  const rawData = {
    equipmentId: formData.get("equipmentId")?.toString(),
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || "medium",
    attachments: parsedAttachments,
  };

  const result = createWorkOrderSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { success: false, error: firstError || "Invalid input" };
  }

  const {
    equipmentId,
    type,
    title,
    description,
    priority,
    attachments: workOrderAttachments,
  } = result.data;

  // Calculate SLA due date
  const dueBy = calculateDueBy(priority);

  /**
   * Create work order within a transaction to ensure atomicity.
   *
   * Transaction Requirements:
   * - Work order and attachments must be created together (all-or-nothing)
   * - SQLite SERIALIZABLE isolation is sufficient for this insert-only pattern
   * - PostgreSQL migration: READ COMMITTED is acceptable (no read-then-write)
   *
   * @see docs/transactions.md for isolation level documentation
   */
  try {
    // Get equipment details to inherit department and check ownership
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
    });

    if (!equipmentItem) {
      return { success: false, error: "Equipment not found" };
    }

    const workOrder = await db.transaction(async (tx) => {
      const [newWorkOrder] = await tx
        .insert(workOrders)
        .values({
          equipmentId,
          type,
          title,
          description,
          priority,
          reportedById: user.id,
          departmentId: equipmentItem.departmentId, // Inherit department from equipment
          status: "open",
          dueBy,
        })
        .returning();

      // Insert attachments if any
      if (workOrderAttachments && workOrderAttachments.length > 0) {
        await tx.insert(attachments).values(
          workOrderAttachments.map((att) => ({
            entityType: "work_order" as const,
            entityId: newWorkOrder.id,
            type: "photo" as const, // Default to photo for work order uploads
            filename: att.filename,
            s3Key: att.s3Key,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
            uploadedById: user.id,
          }))
        );
      }

      return newWorkOrder;
    });

    // Notify techs for critical/high priority work orders
    if (priority === "critical" || priority === "high") {
      const techRole = await db.query.roles.findFirst({
        where: eq(roles.name, "tech"),
      });

      if (techRole) {
        const whereConditions = [
          eq(users.roleId, techRole.id),
          eq(users.isActive, true),
        ];

        // Only filter by department if the equipment has one
        if (equipmentItem.departmentId) {
          whereConditions.push(
            eq(users.departmentId, equipmentItem.departmentId)
          );
        }

        const techs = await db.query.users.findMany({
          where: and(...whereConditions),
        });

        if (techs.length > 0) {
          await db.insert(notifications).values(
            techs.map((tech) => ({
              userId: tech.id,
              type: "work_order_created" as const,
              title: `New ${priority} Priority Work Order`,
              message: `${title} - ${equipmentItem?.name || "Unknown Equipment"}`,
              link: `/maintenance/work-orders/${workOrder.id}`,
            }))
          );
        }
      }
    }

    // Notify equipment owner if exists
    if (equipmentItem?.ownerId) {
      await db.insert(notifications).values({
        userId: equipmentItem.ownerId,
        type: "work_order_created" as const,
        title: "Work Order Opened on Your Equipment",
        message: `${title} - ${equipmentItem.name}`,
        link: `/maintenance/work-orders/${workOrder.id}`,
      });
    }

    // Audit log for work order creation
    await logAudit({
      entityType: "work_order",
      entityId: workOrder.id,
      action: "CREATE",
      details: {
        equipmentId,
        type,
        title,
        priority,
        reportedById: user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/my-work-orders");
    revalidatePath("/");

    return { success: true, data: workOrder };
  } catch (error) {
    workOrderLogger.error(
      { error, userId: user.id },
      "Failed to create work order"
    );
    return {
      success: false,
      error: "Failed to create work order. Please try again.",
    };
  }
}

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

export async function resolveWorkOrder(
  workOrderId: string,
  _prevState: ActionResult<void> | undefined,
  formData: FormData
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

  const rawData = {
    resolutionNotes: formData.get("resolutionNotes"),
    signature: formData.get("signature")?.toString() || undefined,
  };

  const result = resolveWorkOrderSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: "Resolution notes are required" };
  }

  const existingWorkOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
  });

  if (!existingWorkOrder) {
    return { success: false, error: "Work order not found" };
  }

  try {
    await db.transaction(async (tx) => {
      // Update work order status
      await tx
        .update(workOrders)
        .set({
          status: "resolved",
          resolutionNotes: result.data.resolutionNotes,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workOrders.id, workOrderId));

      // Handle signature upload if provided
      if (result.data.signature) {
        // Import S3 utilities dynamically to avoid circular dependencies
        const { uploadFile, generateS3Key } = await import("@/lib/s3");
        const { uuidv7 } = await import("uuidv7");

        // Parse base64 data URL
        const matches = result.data.signature.match(
          /^data:image\/png;base64,(.+)$/
        );
        if (matches) {
          const base64Data = matches[1];
          const buffer = Buffer.from(base64Data, "base64");
          const attachmentId = uuidv7();
          const filename = `signature_${Date.now()}.png`;
          const s3Key = generateS3Key(
            "work_order",
            workOrderId,
            attachmentId,
            filename
          );

          // Upload to S3
          await uploadFile(s3Key, buffer, "image/png");

          // Create attachment record
          await tx.insert(attachments).values({
            id: attachmentId,
            entityType: "work_order",
            entityId: workOrderId,
            type: "signature",
            filename,
            s3Key,
            mimeType: "image/png",
            sizeBytes: buffer.length,
            uploadedById: user.id,
          });
        }
      }

      // Log status change
      await tx.insert(workOrderLogs).values({
        workOrderId,
        action: "status_change",
        oldValue: existingWorkOrder.status,
        newValue: "resolved",
        createdById: user.id,
      });
    });

    // Notify reporter that their work order was resolved
    if (existingWorkOrder.reportedById !== user.id) {
      await createNotification({
        userId: existingWorkOrder.reportedById,
        type: "work_order_resolved",
        title: "Your Work Order Has Been Resolved",
        message: existingWorkOrder.title,
        link: `/maintenance/work-orders/${workOrderId}`,
      });
    }

    // Audit log for work order resolution
    await logAudit({
      entityType: "work_order",
      entityId: workOrderId,
      action: "UPDATE",
      details: {
        action: "resolved",
        previousStatus: existingWorkOrder.status,
        resolutionNotes: result.data.resolutionNotes,
        hasSignature: !!result.data.signature,
      },
    });

    revalidatePath(`/maintenance/work-orders/${workOrderId}`);
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    workOrderLogger.error(
      { error, userId: user.id, workOrderId },
      "Failed to resolve work order"
    );
    return {
      success: false,
      error: "Failed to resolve work order. Please try again.",
    };
  }
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
    // Batch fetch all existing work orders to avoid N+1 queries
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

      // Collect status change logs
      if (status && status !== existing.status) {
        statusLogs.push({
          workOrderId: id,
          action: "status_change",
          oldValue: existing.status,
          newValue: status,
          createdById: user.id,
        });
      }

      // Collect assignment logs and notifications
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

    /**
     * Execute all database operations within a transaction for atomicity.
     * This ensures that work order updates, logs, and notifications are
     * all committed together or all rolled back on failure.
     */
    await db.transaction(async (tx) => {
      // Execute batch update using a single SQL statement with IN clause
      if (validIds.length > 0) {
        await tx
          .update(workOrders)
          .set(updateData)
          .where(inArray(workOrders.id, validIds));
      }

      // Batch insert logs
      if (statusLogs.length > 0) {
        await tx.insert(workOrderLogs).values(statusLogs);
      }

      if (assignmentLogs.length > 0) {
        await tx.insert(workOrderLogs).values(assignmentLogs);
      }

      // Batch insert notifications
      if (assignmentNotifications.length > 0) {
        await tx.insert(notifications).values(assignmentNotifications);
      }
    });

    const updated = validIds.length;

    // Audit log for bulk update
    if (updated > 0) {
      await logAudit({
        entityType: "work_order",
        entityId: validIds[0], // Log with first ID, details contain all
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
    // Fetch the original work order
    const originalWorkOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: {
        equipment: true,
      },
    });

    if (!originalWorkOrder) {
      return { success: false, error: "Work order not found" };
    }

    // Calculate SLA due date for the new work order
    const dueBy = calculateDueBy(originalWorkOrder.priority);

    // Create the duplicate work order
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

// ============================================================================
// Quick Actions - One-click operations for work order cards
// ============================================================================

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

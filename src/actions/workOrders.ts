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
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { workOrderLogger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import type { ActionResult } from "@/lib/types/actions";
import {
  createWorkOrderSchema,
  resolveWorkOrderSchema,
  updateChecklistItemSchema,
  updateWorkOrderSchema,
} from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

export async function createWorkOrder(
  _prevState: ActionResult<unknown>,
  formData: FormData
): Promise<ActionResult<unknown>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "You must be logged in to create a work order",
    };
  }

  // Extract attachments from JSON if provided
  const attachmentsJson = formData.get("attachments")?.toString();
  const parsedAttachments = attachmentsJson ? JSON.parse(attachmentsJson) : [];

  const rawData = {
    equipmentId: Number(formData.get("equipmentId")),
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

  // Create the work order within a transaction to ensure all or nothing
  try {
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

    // Get equipment details for notifications
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
    });

    // Notify techs for critical/high priority work orders
    if (priority === "critical" || priority === "high") {
      const techRole = await db.query.roles.findFirst({
        where: eq(roles.name, "tech"),
      });

      if (techRole) {
        const techs = await db.query.users.findMany({
          where: and(eq(users.roleId, techRole.id), eq(users.isActive, true)),
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
  workOrderId: number,
  _prevState: ActionResult<void>,
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
  if (assignedToId) rawData.assignedToId = Number(assignedToId) || null;
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

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function resolveWorkOrder(
  workOrderId: number,
  _prevState: ActionResult<void>,
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

  await db
    .update(workOrders)
    .set({
      status: "resolved",
      resolutionNotes: result.data.resolutionNotes,
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

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath("/maintenance/work-orders");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function addWorkOrderComment(
  workOrderId: number,
  _prevState: ActionResult<void>,
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

  await db.insert(workOrderLogs).values({
    workOrderId,
    action: "comment",
    oldValue: null,
    newValue: comment.trim(),
    createdById: user.id,
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);

  return { success: true };
}

export async function updateChecklistItem(
  completionId: number,
  workOrderId: number,
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

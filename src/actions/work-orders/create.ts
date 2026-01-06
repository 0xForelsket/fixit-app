"use server";

import {
  attachments,
  db,
  eq,
  equipmentTable,
  notifications,
  roles,
  users,
  workOrders,
} from "./shared";
import { logAudit } from "@/lib/audit";
import { workOrderLogger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import type { ActionResult } from "@/lib/types/actions";
import { safeJsonParseOrDefault } from "@/lib/utils";
import { createWorkOrderSchema } from "@/lib/validations";
import { and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
          departmentId: equipmentItem.departmentId,
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
            type: "photo" as const,
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

"use server";

import {
  attachments,
  db,
  downtimeLogs,
  eq,
  equipmentTable,
  isNull,
  workOrderLogs,
  workOrders,
} from "./shared";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { workOrderLogger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { resolveWorkOrderSchema } from "@/lib/validations";
import { and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

      // Auto-resolve linked downtime
      const linkedDowntime = await tx.query.downtimeLogs.findFirst({
        where: and(
          eq(downtimeLogs.workOrderId, workOrderId),
          isNull(downtimeLogs.endTime)
        ),
      });

      if (linkedDowntime) {
        // End the downtime
        await tx
          .update(downtimeLogs)
          .set({ endTime: new Date() })
          .where(eq(downtimeLogs.id, linkedDowntime.id));

        // Set equipment back to operational
        await tx
          .update(equipmentTable)
          .set({ status: "operational" })
          .where(eq(equipmentTable.id, existingWorkOrder.equipmentId));
      }
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

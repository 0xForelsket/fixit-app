"use server";

import { db } from "@/db";
import type { Attachment } from "@/db/schema";
import { attachments, equipment, workOrders } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { deleteObject, getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import type { AttachmentWithUrl } from "@/lib/types/attachments";
import {
  type UploadAttachmentInput,
  uploadAttachmentSchema,
} from "@/lib/validations/attachments";
import { and, eq, inArray, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CreateAttachmentInput = UploadAttachmentInput & { s3Key: string };

export interface GetAttachmentsFilters {
  entityType?: "work_order" | "equipment";
  mimeType?: string; // e.g. "image/" or "application/pdf"
  search?: string;
}

export async function getAllAttachments(
  filters?: GetAttachmentsFilters
): Promise<ActionResult<AttachmentWithUrl[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check permission based on entity type filter
  // If no filter, user needs permission to view both work orders and equipment
  if (filters?.entityType === "work_order") {
    if (!userHasPermission(user, PERMISSIONS.TICKET_VIEW)) {
      return {
        success: false,
        error: "You don't have permission to view work order attachments",
      };
    }
  } else if (filters?.entityType === "equipment") {
    if (!userHasPermission(user, PERMISSIONS.EQUIPMENT_VIEW)) {
      return {
        success: false,
        error: "You don't have permission to view equipment attachments",
      };
    }
  } else {
    // No filter - need at least one view permission
    const canViewWorkOrders = userHasPermission(user, PERMISSIONS.TICKET_VIEW);
    const canViewEquipment = userHasPermission(
      user,
      PERMISSIONS.EQUIPMENT_VIEW
    );
    if (!canViewWorkOrders && !canViewEquipment) {
      return {
        success: false,
        error: "You don't have permission to view attachments",
      };
    }
  }

  const conditions = [];

  if (filters?.entityType) {
    conditions.push(eq(attachments.entityType, filters.entityType));
  }

  if (filters?.mimeType) {
    conditions.push(like(attachments.mimeType, `${filters.mimeType}%`));
  }

  if (filters?.search) {
    conditions.push(like(attachments.filename, `%${filters.search}%`));
  }

  const data = await db.query.attachments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
  });

  // Extract Entity IDs to fetch names in bulk
  const workOrderIds = new Set<string>();
  const equipmentIds = new Set<string>();

  for (const file of data) {
    if (file.entityType === "work_order") {
      workOrderIds.add(file.entityId);
    } else if (file.entityType === "equipment") {
      equipmentIds.add(file.entityId);
    }
  }

  const entityNames = new Map<string, string>();

  // Fetch Work Order Titles
  if (workOrderIds.size > 0) {
    const wos = await db.query.workOrders.findMany({
      where: inArray(workOrders.id, Array.from(workOrderIds)),
      columns: { id: true, title: true },
    });
    for (const wo of wos) {
      entityNames.set(`work_order-${wo.id}`, wo.title);
    }
  }

  // Fetch Equipment Names
  if (equipmentIds.size > 0) {
    const eqs = await db.query.equipment.findMany({
      where: inArray(equipment.id, Array.from(equipmentIds)),
      columns: { id: true, name: true },
    });
    for (const eqItem of eqs) {
      entityNames.set(`equipment-${eqItem.id}`, eqItem.name);
    }
  }

  const dataWithUrls = await Promise.all(
    data.map(async (file) => ({
      ...file,
      url: await getPresignedDownloadUrl(file.s3Key),
      entityName: entityNames.get(`${file.entityType}-${file.entityId}`),
    }))
  );

  return { success: true, data: dataWithUrls };
}

export type AttachmentActionState = {
  error?: string;
  success?: boolean;
  data?: Attachment;
};

export async function createAttachment(
  rawData: CreateAttachmentInput
): Promise<AttachmentActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = uploadAttachmentSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid attachment data" };
  }

  const { entityType, entityId, type, filename, mimeType, sizeBytes } =
    result.data;

  if (!rawData.s3Key) {
    return { error: "S3 Key is required" };
  }

  try {
    const [newAttachment] = await db
      .insert(attachments)
      .values({
        entityType,
        entityId,
        type,
        filename,
        s3Key: rawData.s3Key,
        mimeType,
        sizeBytes,
        uploadedById: user.id,
      })
      .returning();

    // Revalidate paths based on entity
    if (entityType === "work_order") {
      revalidatePath(`/maintenance/work-orders/${entityId}`);
      revalidatePath(`/my-tickets/${entityId}`);
    } else if (entityType === "equipment") {
      revalidatePath(`/assets/equipment/${entityId}`);
    }

    return { success: true, data: newAttachment };
  } catch (error) {
    console.error("Failed to create attachment:", error);
    return { error: "Database error" };
  }
}

export async function deleteAttachment(
  attachmentId: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });

  if (!attachment) {
    return { success: false, error: "Attachment not found" };
  }

  // Check permissions - user can delete if:
  // 1. They uploaded the attachment (owner)
  // 2. They have the appropriate delete permission for the entity type
  const isOwner = attachment.uploadedById === user.id;

  if (!isOwner) {
    // Check entity-specific delete permissions
    let hasDeletePermission = false;

    if (attachment.entityType === "work_order") {
      hasDeletePermission = userHasPermission(user, PERMISSIONS.TICKET_UPDATE);
    } else if (attachment.entityType === "equipment") {
      hasDeletePermission = userHasPermission(
        user,
        PERMISSIONS.EQUIPMENT_UPDATE
      );
    } else {
      // For other entity types, require wildcard permission
      hasDeletePermission = userHasPermission(user, PERMISSIONS.ALL);
    }

    if (!hasDeletePermission) {
      return {
        success: false,
        error:
          "Forbidden: You can only delete your own uploads or need appropriate permissions",
      };
    }
  }

  try {
    // 1. Delete from S3
    await deleteObject(attachment.s3Key);

    // 2. Delete from DB
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    // 3. Revalidate paths
    if (attachment.entityType === "work_order") {
      revalidatePath(`/maintenance/work-orders/${attachment.entityId}`);
      revalidatePath(
        `/maintenance/work-orders/${attachment.entityId}/mobile-work-order-view`
      );
    } else if (attachment.entityType === "equipment") {
      revalidatePath(`/assets/equipment/${attachment.entityId}`);
    }
    revalidatePath("/documents");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return { success: false, error: "Failed to delete attachment" };
  }
}

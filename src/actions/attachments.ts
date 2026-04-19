"use server";

import { db } from "@/db";
import type { Attachment } from "@/db/schema";
import { attachments, equipment, workOrders } from "@/db/schema";
import {
  authorizeAttachmentAccessById,
  authorizeAttachmentEntityAccess,
} from "@/lib/attachments-auth";
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
  entityType?:
    | "work_order"
    | "equipment"
    | "user"
    | "location"
    | "vendor"
    | "spare_part";
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

  const authorizedData = (
    await Promise.all(
      data.map(async (file) => {
        const access = await authorizeAttachmentEntityAccess({
          user,
          entityType: file.entityType,
          entityId: file.entityId,
          action: "view",
        });

        return access.allowed ? file : null;
      })
    )
  ).filter((file): file is (typeof data)[number] => file !== null);

  // Extract Entity IDs to fetch names in bulk
  const workOrderIds = new Set<string>();
  const equipmentIds = new Set<string>();

  for (const file of authorizedData) {
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
    authorizedData.map(async (file) => ({
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

  const access = await authorizeAttachmentEntityAccess({
    user,
    entityType,
    entityId,
    action: "upload",
  });

  if (!access.exists) {
    return { error: "Attachment parent not found" };
  }

  if (!access.allowed) {
    return { error: "Forbidden" };
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

  const access = await authorizeAttachmentAccessById({
    user,
    attachmentId,
    action: "delete",
  });

  if (!access.exists || !access.attachment) {
    return { success: false, error: "Attachment not found" };
  }

  if (!access.allowed) {
    return {
      success: false,
      error: "Forbidden",
    };
  }

  const attachment = access.attachment;

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

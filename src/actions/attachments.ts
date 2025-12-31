"use server";

import { db } from "@/db";
import type { Attachment } from "@/db/schema";
import { attachments } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import {
  type UploadAttachmentInput,
  uploadAttachmentSchema,
} from "@/lib/validations/attachments";
import { revalidatePath } from "next/cache";
import { and, desc, eq, like } from "drizzle-orm";
import type { ActionResult } from "@/lib/types/actions";
import { getPresignedDownloadUrl } from "@/lib/s3";
import type { AttachmentWithUrl } from "@/lib/types/attachments";

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

  const dataWithUrls = await Promise.all(
    data.map(async (file) => ({
      ...file,
      url: await getPresignedDownloadUrl(file.s3Key),
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

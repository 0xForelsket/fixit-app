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

export type CreateAttachmentInput = UploadAttachmentInput & { s3Key: string };

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
      revalidatePath(`/dashboard/work-orders/${entityId}`);
      revalidatePath(`/my-tickets/${entityId}`);
    } else if (entityType === "equipment") {
      revalidatePath(`/admin/equipment/${entityId}`);
    }

    return { success: true, data: newAttachment };
  } catch (error) {
    console.error("Failed to create attachment:", error);
    return { error: "Database error" };
  }
}

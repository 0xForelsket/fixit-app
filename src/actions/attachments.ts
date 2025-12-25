"use server";

import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { uploadAttachmentSchema } from "@/lib/validations/attachments";
import { revalidatePath } from "next/cache";

export type AttachmentActionState = {
  error?: string;
  success?: boolean;
  data?: any;
};

export async function createAttachment(
  rawData: any
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

  // Note: s3Key is usually determined by the client during upload
  // We expect rawData to include the s3Key generated during presigned upload
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
    if (entityType === "ticket") {
      revalidatePath(`/dashboard/tickets/${entityId}`);
      revalidatePath(`/my-tickets/${entityId}`);
    } else if (entityType === "machine") {
      revalidatePath(`/admin/machines/${entityId}`);
    }

    return { success: true, data: newAttachment };
  } catch (error) {
    console.error("Failed to create attachment:", error);
    return { error: "Database error" };
  }
}

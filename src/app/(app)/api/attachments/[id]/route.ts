import { db } from "@/db";
import { attachments } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { authorizeAttachmentAccessById } from "@/lib/attachments-auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { deleteObject, getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

// GET /api/attachments/[id] - Get presigned download URL
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id: attachmentId } = await params;

    const access = await authorizeAttachmentAccessById({
      user,
      attachmentId,
      action: "view",
    });

    if (!access.exists || !access.attachment) {
      return ApiErrors.notFound("Attachment", requestId);
    }

    if (!access.allowed) {
      return ApiErrors.forbidden(requestId);
    }

    const attachment = access.attachment;
    const downloadUrl = await getPresignedDownloadUrl(attachment.s3Key);

    return apiSuccess({
      attachment,
      downloadUrl,
    });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to get attachment");
    return ApiErrors.internal(error, requestId);
  }
}

// DELETE /api/attachments/[id] - Delete attachment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id: attachmentId } = await params;

    const access = await authorizeAttachmentAccessById({
      user,
      attachmentId,
      action: "delete",
    });

    if (!access.exists || !access.attachment) {
      return ApiErrors.notFound("Attachment", requestId);
    }

    if (!access.allowed) {
      return ApiErrors.forbidden(requestId);
    }

    const attachment = access.attachment;

    // Delete from S3
    try {
      await deleteObject(attachment.s3Key);
    } catch (s3Error) {
      // Log but continue - file may not exist
      apiLogger.warn({ requestId, s3Error }, "Failed to delete from S3");
    }

    // Delete from database
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to delete attachment");
    return ApiErrors.internal(error, requestId);
  }
}

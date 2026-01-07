import { db } from "@/db";
import { type AttachmentType, type EntityType, attachments } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateS3Key, getPresignedUploadUrl } from "@/lib/s3";
import { getCurrentUser, requireCsrf } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

// GET /api/attachments - List attachments for an entity
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") as EntityType | null;
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return ApiErrors.validationError(
        "entityType and entityId are required",
        requestId
      );
    }

    const attachmentList = await db.query.attachments.findMany({
      where: and(
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId)
      ),
      with: {
        uploadedBy: true,
      },
    });

    return apiSuccess(attachmentList);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to list attachments");
    return ApiErrors.internal(error, requestId);
  }
}

// POST /api/attachments - Create attachment record and get upload URL
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // CSRF protection
    await requireCsrf(request);

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `upload:${clientIp}`,
      RATE_LIMITS.upload.limit,
      RATE_LIMITS.upload.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const body = await request.json();
    const {
      entityType,
      entityId,
      attachmentType,
      filename,
      mimeType,
      sizeBytes,
    } = body;

    // Validate required fields
    if (
      !entityType ||
      !entityId ||
      !attachmentType ||
      !filename ||
      !mimeType ||
      !sizeBytes
    ) {
      return ApiErrors.validationError(
        "Missing required fields: entityType, entityId, attachmentType, filename, mimeType, sizeBytes",
        requestId
      );
    }

    // Create attachment record first to get ID
    const [attachment] = await db
      .insert(attachments)
      .values({
        entityType: entityType as EntityType,
        entityId: entityId,
        type: attachmentType as AttachmentType,
        filename,
        s3Key: "", // Will update after we have the full key
        mimeType,
        sizeBytes: Number(sizeBytes),
        uploadedById: user.id,
      })
      .returning();

    // Generate S3 key using attachment ID
    const s3Key = generateS3Key(entityType, entityId, attachment.id, filename);

    // Update attachment with S3 key
    await db
      .update(attachments)
      .set({ s3Key })
      .where(eq(attachments.id, attachment.id));

    // Generate presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

    // Construct the final attachment object manually to ensure all fields are present
    const finalAttachment = {
      ...attachment,
      s3Key, // key is now set
    };

    return apiSuccess({
      attachment: finalAttachment,
      uploadUrl,
    });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to create attachment");
    return ApiErrors.internal(error, requestId);
  }
}

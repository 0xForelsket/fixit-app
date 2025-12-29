import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getPresignedUploadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  const user = await getCurrentUser();
  if (!user) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    const { filename, mimeType, entityType, entityId } = await request.json();

    if (!filename || !mimeType || !entityType || !entityId) {
      return ApiErrors.validationError("Missing required fields", requestId);
    }

    // Generate a unique S3 key
    // Pattern: {entityType}s/{entityId}/{uuid}-{filename}
    const fileExtension = filename.split(".").pop();
    const s3Key = `${entityType}s/${entityId}/${crypto.randomUUID()}.${fileExtension}`;

    const uploadUrl = await getPresignedUploadUrl(s3Key, mimeType);

    return apiSuccess({ uploadUrl, s3Key });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to generate presigned URL");
    return ApiErrors.internal(error, requestId);
  }
}

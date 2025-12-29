import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Attachment Preview Route
 * 
 * GET /api/attachments/preview?key=path/to/file.jpg
 * 
 * Generates a signed URL for an attachment and redirects to it.
 * This allows client-side <img> tags to show private attachments safely.
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  const user = await getCurrentUser();
  if (!user) {
    return ApiErrors.unauthorized(requestId);
  }

  if (!key) {
    return ApiErrors.validationError("Missing attachment key", requestId);
  }

  try {
    const downloadUrl = await getPresignedDownloadUrl(key, 300); // 5 minute expiry
    
    // Check if we should return the URL or redirect
    const format = searchParams.get("format");
    if (format === "json") {
      return apiSuccess({ url: downloadUrl });
    }

    // Default: redirect for <img> tags
    return redirect(downloadUrl);
  } catch (error) {
    apiLogger.error({ requestId, error, key }, "Failed to generate preview URL");
    return ApiErrors.internal(error, requestId);
  }
}

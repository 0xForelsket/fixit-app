import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser, requireCsrf } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // CSRF protection
    await requireCsrf(request);

    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, user.id));

    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, error }, "Failed to mark all as read");
    return ApiErrors.internal(error, requestId);
  }
}

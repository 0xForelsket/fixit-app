import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST() {
  const requestId = generateRequestId();

  try {
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
    apiLogger.error({ requestId, error }, "Failed to mark all as read");
    return ApiErrors.internal(error, requestId);
  }
}

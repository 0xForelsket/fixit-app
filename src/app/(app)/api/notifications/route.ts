import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 20,
    });

    return apiSuccess({ notifications: userNotifications });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to fetch notifications");
    return ApiErrors.internal(error, requestId);
  }
}

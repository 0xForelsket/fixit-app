import { db } from "@/db";
import { notifications } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id } = await params;
    const notificationId = Number.parseInt(id, 10);

    if (Number.isNaN(notificationId)) {
      return ApiErrors.badRequest("Invalid notification ID", requestId);
    }

    const body = await request.json();

    // Verify the notification belongs to the user
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId),
    });

    if (!notification) {
      return ApiErrors.notFound("Notification", requestId);
    }

    if (notification.userId !== user.id) {
      return ApiErrors.forbidden(requestId);
    }

    // Update notification
    await db
      .update(notifications)
      .set({ isRead: body.isRead })
      .where(eq(notifications.id, notificationId));

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to update notification");
    return ApiErrors.internal(error, requestId);
  }
}

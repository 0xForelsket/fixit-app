import { db } from "@/db";
import { downtimeLogs } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { requireCsrf, requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ downtimeId: string }> }
) {
  const requestId = generateRequestId();
  const { downtimeId } = await params;

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_DOWNTIME_REPORT);

    // Find existing downtime log
    const existing = await db.query.downtimeLogs.findFirst({
      where: eq(downtimeLogs.id, downtimeId),
    });

    if (!existing) {
      return ApiErrors.notFound("Downtime log", requestId);
    }

    if (existing.endTime) {
      return ApiErrors.validationError("Downtime already ended", requestId);
    }

    const [updated] = await db
      .update(downtimeLogs)
      .set({
        endTime: new Date(),
      })
      .where(eq(downtimeLogs.id, downtimeId))
      .returning();

    return apiSuccess(updated, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (error.message === "Forbidden") {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, downtimeId, error }, "End downtime error");
    return ApiErrors.internal(error, requestId);
  }
}

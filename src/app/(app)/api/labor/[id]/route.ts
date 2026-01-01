import { db } from "@/db";
import { laborLogs } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

// GET /api/labor/[id] - Get single labor log
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id: logId } = await params;

    const log = await db.query.laborLogs.findFirst({
      where: eq(laborLogs.id, logId),
      with: {
        user: true,
        workOrder: true,
      },
    });

    if (!log) {
      return ApiErrors.notFound("Labor log", requestId);
    }

    return apiSuccess(log);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching labor log");
    return ApiErrors.internal(error, requestId);
  }
}

// DELETE /api/labor/[id] - Delete labor log
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id: logId } = await params;

    const [deleted] = await db
      .delete(laborLogs)
      .where(eq(laborLogs.id, logId))
      .returning();

    if (!deleted) {
      return ApiErrors.notFound("Labor log", requestId);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error deleting labor log");
    return ApiErrors.internal(error, requestId);
  }
}

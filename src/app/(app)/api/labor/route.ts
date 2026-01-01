import { db } from "@/db";
import { laborLogs } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser, requireCsrf } from "@/lib/session";
import { revalidatePath } from "next/cache";

// POST /api/labor - Create new labor log
export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // CSRF protection
    await requireCsrf(request);

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `labor:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
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
      workOrderId,
      userId,
      startTime,
      endTime,
      durationMinutes,
      hourlyRate,
      notes,
      isBillable,
    } = body;

    if (!workOrderId || !userId || !durationMinutes) {
      return ApiErrors.validationError("Missing required fields", requestId);
    }

    const [log] = await db
      .insert(laborLogs)
      .values({
        workOrderId,
        userId,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        durationMinutes,
        hourlyRate,
        notes,
        isBillable: isBillable ?? true,
      })
      .returning();

    revalidatePath(`/maintenance/work-orders/${workOrderId}`);
    revalidatePath("/maintenance/work-orders");

    return apiSuccess(log, HttpStatus.CREATED, requestId);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error creating labor log");
    return ApiErrors.internal(error, requestId);
  }
}

// GET /api/labor - List labor logs (with optional workOrderId filter)
export async function GET(request: Request) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get("workOrderId");

    const logs = await db.query.laborLogs.findMany({
      where: workOrderId
        ? (laborLogs, { eq }) =>
            eq(laborLogs.workOrderId, workOrderId)
        : undefined,
      with: {
        user: true,
        workOrder: true,
      },
    });

    return apiSuccess(logs);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching labor logs");
    return ApiErrors.internal(error, requestId);
  }
}

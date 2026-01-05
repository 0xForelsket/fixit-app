import { db } from "@/db";
import { downtimeLogs, equipment } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { getCurrentUser, requireCsrf, requirePermission } from "@/lib/session";
import { downtimeLogSchema } from "@/lib/validations/equipment";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

  try {
    const logs = await db.query.downtimeLogs.findMany({
      where: eq(downtimeLogs.equipmentId, equipmentId),
      orderBy: [desc(downtimeLogs.startTime)],
      limit: 20,
      with: {
        reportedBy: {
          columns: { id: true, name: true },
        },
      },
    });

    return apiSuccess(logs, HttpStatus.OK, requestId);
  } catch (error) {
    apiLogger.error(
      { requestId, equipmentId, error },
      "Get downtime logs error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_DOWNTIME_REPORT);
    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    // Verify equipment exists
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
    });

    if (!equipmentItem) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    const body = await request.json();
    const result = downtimeLogSchema
      .omit({ equipmentId: true })
      .safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid downtime data", requestId);
    }

    const [newLog] = await db
      .insert(downtimeLogs)
      .values({
        equipmentId,
        startTime: result.data.startTime,
        endTime: result.data.endTime || null,
        reasonCode: result.data.reasonCode,
        notes: result.data.notes || null,
        reportedById: user.id,
      })
      .returning();

    return apiSuccess(newLog, HttpStatus.CREATED, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (error.message === "Forbidden") {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error(
      { requestId, equipmentId, error },
      "Create downtime log error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

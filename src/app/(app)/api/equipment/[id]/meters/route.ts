import { db } from "@/db";
import { equipment, equipmentMeters } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";
import { meterSchema } from "@/lib/validations/equipment";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

  try {
    await requireAuth();

    const meters = await db.query.equipmentMeters.findMany({
      where: eq(equipmentMeters.equipmentId, equipmentId),
      orderBy: (m, { asc }) => [asc(m.name)],
    });

    return apiSuccess(meters, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    apiLogger.error({ requestId, equipmentId, error }, "Get equipment meters error");
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
    await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

    // Verify equipment exists
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
    });

    if (!equipmentItem) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    const body = await request.json();
    const result = meterSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid meter data", requestId);
    }

    const [newMeter] = await db
      .insert(equipmentMeters)
      .values({
        equipmentId,
        name: result.data.name,
        type: result.data.type,
        unit: result.data.unit,
        currentReading: result.data.currentReading?.toString() || null,
        lastReadingDate: result.data.currentReading ? new Date() : null,
      })
      .returning();

    return apiSuccess(newMeter, HttpStatus.CREATED, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (error.message === "Forbidden") {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, equipmentId, error }, "Create meter error");
    return ApiErrors.internal(error, requestId);
  }
}

import { db } from "@/db";
import { equipmentMeters, meterReadings } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";
import { meterSchema } from "@/lib/validations/equipment";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const requestId = generateRequestId();
  const { meterId } = await params;

  try {
    await requireAuth();

    const meter = await db.query.equipmentMeters.findFirst({
      where: eq(equipmentMeters.id, meterId),
      with: {
        readings: {
          orderBy: (r, { desc }) => [desc(r.recordedAt)],
          limit: 10,
          with: {
            recordedBy: {
              columns: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!meter) {
      return ApiErrors.notFound("Meter", requestId);
    }

    return apiSuccess(meter, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    apiLogger.error({ requestId, meterId, error }, "Get meter error");
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const requestId = generateRequestId();
  const { meterId } = await params;

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

    const existing = await db.query.equipmentMeters.findFirst({
      where: eq(equipmentMeters.id, meterId),
    });

    if (!existing) {
      return ApiErrors.notFound("Meter", requestId);
    }

    const body = await request.json();
    const result = meterSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid meter data", requestId);
    }

    // Track if reading changed
    const readingChanged =
      result.data.currentReading !== undefined &&
      result.data.currentReading?.toString() !== existing.currentReading;

    const [updatedMeter] = await db
      .update(equipmentMeters)
      .set({
        name: result.data.name,
        type: result.data.type,
        unit: result.data.unit,
        currentReading:
          result.data.currentReading?.toString() || existing.currentReading,
        lastReadingDate: readingChanged ? new Date() : existing.lastReadingDate,
      })
      .where(eq(equipmentMeters.id, meterId))
      .returning();

    // If reading changed, log it to history
    if (readingChanged && result.data.currentReading !== undefined) {
      const user = await requireAuth();
      await db.insert(meterReadings).values({
        meterId,
        reading: result.data.currentReading.toString(),
        recordedById: user.id,
        recordedAt: new Date(),
      });
    }

    return apiSuccess(updatedMeter, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (error.message === "Forbidden") {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, meterId, error }, "Update meter error");
    return ApiErrors.internal(error, requestId);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const requestId = generateRequestId();
  const { meterId } = await params;

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

    const existing = await db.query.equipmentMeters.findFirst({
      where: eq(equipmentMeters.id, meterId),
    });

    if (!existing) {
      return ApiErrors.notFound("Meter", requestId);
    }

    // Delete meter (readings will be cascaded due to onDelete: "cascade")
    await db.delete(equipmentMeters).where(eq(equipmentMeters.id, meterId));

    return apiSuccess({ deleted: true }, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (error.message === "Forbidden") {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, meterId, error }, "Delete meter error");
    return ApiErrors.internal(error, requestId);
  }
}

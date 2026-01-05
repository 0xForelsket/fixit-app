import { db } from "@/db";
import { equipmentMeters, meterReadings } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { getCurrentUser, requireCsrf, requirePermission } from "@/lib/session";
import { meterReadingSchema } from "@/lib/validations/equipment";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const requestId = generateRequestId();
  const { meterId } = await params;

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_METERS_RECORD);
    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    // Verify meter exists
    const meter = await db.query.equipmentMeters.findFirst({
      where: eq(equipmentMeters.id, meterId),
    });

    if (!meter) {
      return ApiErrors.notFound("Meter", requestId);
    }

    const body = await request.json();
    const result = meterReadingSchema.omit({ meterId: true }).safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid meter reading data", requestId);
    }

    const now = new Date();

    // Create reading record
    const [newReading] = await db
      .insert(meterReadings)
      .values({
        meterId,
        reading: result.data.reading.toString(),
        recordedById: user.id,
        recordedAt: now,
        notes: result.data.notes || null,
      })
      .returning();

    // Update meter's current reading
    await db
      .update(equipmentMeters)
      .set({
        currentReading: result.data.reading.toString(),
        lastReadingDate: now,
      })
      .where(eq(equipmentMeters.id, meterId));

    return apiSuccess(newReading, HttpStatus.CREATED, requestId);
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
      { requestId, meterId, error },
      "Record meter reading error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

import { db } from "@/db";
import { equipment as equipmentTable, equipmentStatusLogs } from "@/db/schema";
import { ApiErrors, apiSuccess, HttpStatus } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";
import { updateEquipmentSchema } from "@/lib/validations/equipment";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const equipmentId = Number(id);

  try {
    await requireAuth();

    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
      with: {
        location: true,
        owner: true,
        parent: true,
        children: true,
      },
    });

    if (!equipmentItem) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    return apiSuccess(equipmentItem, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    apiLogger.error({ requestId, id, error }, "Get equipment by id error");
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const equipmentId = Number(id);

  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `equipment-update:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

    const body = await request.json();
    const result = updateEquipmentSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid input data", requestId);
    }

    const existing = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
    });

    if (!existing) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    // Log status change if needed
    if (result.data.status && result.data.status !== existing.status) {
      const user = await requireAuth();
      await db.insert(equipmentStatusLogs).values({
        equipmentId,
        oldStatus: existing.status,
        newStatus: result.data.status,
        changedById: user.id,
      });
    }

    const [updatedItem] = await db
      .update(equipmentTable)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(equipmentTable.id, equipmentId))
      .returning();

    revalidatePath("/assets/equipment");
    revalidatePath(`/assets/equipment/${equipmentId}`);
    revalidatePath(`/equipment/${existing.code}`);

    return apiSuccess(updatedItem, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return ApiErrors.unauthorized(requestId);
      if (error.message === "Forbidden") return ApiErrors.forbidden(requestId);
    }
    apiLogger.error({ requestId, id, error }, "Update equipment error");
    return ApiErrors.internal(error, requestId);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id } = await params;
  const equipmentId = Number(id);

  try {
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_DELETE);

    const existing = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
      with: {
        workOrders: { limit: 1 },
        children: { limit: 1 },
      },
    });

    if (!existing) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    if (existing.workOrders.length > 0) {
      return ApiErrors.badRequest("Cannot delete equipment with existing work orders", requestId);
    }

    if (existing.children.length > 0) {
      return ApiErrors.badRequest("Cannot delete equipment that has sub-assets", requestId);
    }

    await db.delete(equipmentTable).where(eq(equipmentTable.id, equipmentId));

    revalidatePath("/assets/equipment");

    return apiSuccess({ deleted: true }, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return ApiErrors.unauthorized(requestId);
      if (error.message === "Forbidden") return ApiErrors.forbidden(requestId);
    }
    apiLogger.error({ requestId, id, error }, "Delete equipment error");
    return ApiErrors.internal(error, requestId);
  }
}

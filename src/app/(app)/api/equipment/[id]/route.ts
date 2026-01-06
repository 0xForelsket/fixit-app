import { db } from "@/db";
import { equipmentStatusLogs, equipment as equipmentTable } from "@/db/schema";
import { ApiErrors, HttpStatus, apiError, apiSuccess } from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
// import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";
import { updateEquipmentSchema } from "@/lib/validations/equipment";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

  try {
    await requireAuth();

    const equipmentItem = await db.query.equipment.findFirst({
      where: or(
        eq(equipmentTable.id, equipmentId),
        eq(equipmentTable.code, equipmentId)
      ),
      with: {
        // Payload compression: only fetch needed columns from relations
        location: {
          columns: { id: true, name: true, code: true },
        },
        owner: {
          columns: { id: true, name: true, employeeId: true },
        },
        parent: {
          columns: { id: true, name: true, code: true },
        },
        children: {
          columns: { id: true, name: true, code: true, status: true },
        },
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
    apiLogger.error(
      { requestId, equipmentId, error },
      "Get equipment by id error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

  try {
    // Rate limit check...
    
    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);

    const body = await request.json();
    const result = updateEquipmentSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid input data", requestId);
    }

    const existing = await db.query.equipment.findFirst({
      where: or(
         eq(equipmentTable.id, equipmentId),
         eq(equipmentTable.code, equipmentId)
      ),
    });

    if (!existing) {
      return ApiErrors.notFound("Equipment", requestId);
    }

    // Log status change if needed
    if (result.data.status && result.data.status !== existing.status) {
      const user = await requireAuth();
      await db.insert(equipmentStatusLogs).values({
        equipmentId: existing.id,
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
      .where(eq(equipmentTable.id, existing.id))
      .returning();
    
    revalidatePath("/assets/equipment");
    revalidatePath(`/assets/equipment/${existing.code}`);
    // Handle case where code might have changed (though it's usually static/rarely changed, the schema allows it)
    if (result.data.code && result.data.code !== existing.code) {
        revalidatePath(`/assets/equipment/${result.data.code}`);
    }
    // Also revalidate the ID-based path if that's ever used
    revalidatePath(`/assets/equipment/${existing.id}`);

    return apiSuccess(updatedItem, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return ApiErrors.unauthorized(requestId);
      // Handle CSRF errors gracefully
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return apiError(
             "Security check failed (CSRF): Please refresh the page and try again",
             HttpStatus.FORBIDDEN,
             { requestId }
        );
      }
    }
    apiLogger.error(
      { requestId, equipmentId, error },
      "Update equipment error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: equipmentId } = await params;

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
      return ApiErrors.badRequest(
        "Cannot delete equipment with existing work orders",
        requestId
      );
    }

    if (existing.children.length > 0) {
      return ApiErrors.badRequest(
        "Cannot delete equipment that has sub-assets",
        requestId
      );
    }

    await db.delete(equipmentTable).where(eq(equipmentTable.id, equipmentId));

    revalidatePath("/assets/equipment");

    return apiSuccess({ deleted: true }, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized")
        return ApiErrors.unauthorized(requestId);
      if (error.message === "Forbidden") return ApiErrors.forbidden(requestId);
      // Handle CSRF errors gracefully
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return apiError(
             "Security check failed (CSRF): Please refresh the page and try again",
             HttpStatus.FORBIDDEN,
             { requestId }
        );
      }
    }
    apiLogger.error(
      { requestId, equipmentId, error },
      "Delete equipment error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

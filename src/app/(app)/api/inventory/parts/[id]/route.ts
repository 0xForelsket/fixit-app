import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

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

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return ApiErrors.badRequest("Invalid part ID", requestId);
    }

    const part = await db.query.spareParts.findFirst({
      where: eq(spareParts.id, partId),
    });

    if (!part) {
      return ApiErrors.notFound("Part", requestId);
    }

    return apiSuccess(part);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching part");
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_UPDATE)) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return ApiErrors.badRequest("Invalid part ID", requestId);
    }

    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      description,
      category,
      unitCost,
      reorderPoint,
      leadTimeDays,
      isActive,
    } = body;

    const [part] = await db
      .update(spareParts)
      .set({
        name,
        sku,
        barcode,
        description,
        category,
        unitCost,
        reorderPoint,
        leadTimeDays,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, partId))
      .returning();

    if (!part) {
      return ApiErrors.notFound("Part", requestId);
    }

    return apiSuccess(part);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error updating part");
    return ApiErrors.internal(error, requestId);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_DELETE)) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return ApiErrors.badRequest("Invalid part ID", requestId);
    }

    const [deleted] = await db
      .delete(spareParts)
      .where(eq(spareParts.id, partId))
      .returning();

    if (!deleted) {
      return ApiErrors.notFound("Part", requestId);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error deleting part");
    return ApiErrors.internal(error, requestId);
  }
}

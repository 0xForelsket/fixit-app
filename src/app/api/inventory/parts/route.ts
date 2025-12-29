import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { ApiErrors, apiSuccess, HttpStatus } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user || !userHasPermission(user, PERMISSIONS.INVENTORY_CREATE)) {
      return ApiErrors.unauthorized(requestId);
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

    if (!name || !sku || !category) {
      return ApiErrors.validationError("Missing required fields", requestId);
    }

    const [part] = await db
      .insert(spareParts)
      .values({
        name,
        sku,
        barcode,
        description,
        category,
        unitCost,
        reorderPoint: reorderPoint ?? 0,
        leadTimeDays,
        isActive: isActive ?? true,
      })
      .returning();

    return apiSuccess(part, HttpStatus.CREATED, requestId);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error creating part");
    return ApiErrors.internal(error, requestId);
  }
}

export async function GET() {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const parts = await db.query.spareParts.findMany();

    return apiSuccess(parts);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching parts");
    return ApiErrors.internal(error, requestId);
  }
}

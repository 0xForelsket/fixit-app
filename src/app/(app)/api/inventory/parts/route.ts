import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser, requireCsrf } from "@/lib/session";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // CSRF protection
    await requireCsrf(request);

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `inventory:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
    );
    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

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
      vendorId,
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
        vendorId,
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

    // Payload compression: only return fields needed for list display
    const parts = await db.query.spareParts.findMany({
      columns: {
        id: true,
        displayId: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        unitCost: true,
        reorderPoint: true,
        isActive: true,
      },
      orderBy: (spareParts, { asc }) => [asc(spareParts.name)],
      limit: 100, // Pagination - return max 100 items
    });

    return apiSuccess(parts);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching parts");
    return ApiErrors.internal(error, requestId);
  }
}

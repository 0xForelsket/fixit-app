import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import {
  ApiErrors,
  HttpStatus,
  apiSuccess,
  apiSuccessPaginated,
  handleApiError,
} from "@/lib/api-error";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { PERMISSIONS } from "@/lib/permissions";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";
import { createEquipmentSchema, paginationSchema } from "@/lib/validations";
import { and, eq, like, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const locationId = searchParams.get("locationId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [];

    if (locationId) {
      conditions.push(eq(equipmentTable.locationId, locationId));
    }

    if (departmentId) {
      conditions.push(eq(equipmentTable.departmentId, departmentId));
    }

    if (status) {
      conditions.push(
        eq(
          equipmentTable.status,
          status as (typeof equipmentTable.status.enumValues)[number]
        )
      );
    }

    if (search) {
      conditions.push(
        sql`(${like(equipmentTable.name, `%${search}%`)} OR ${like(equipmentTable.code, `%${search}%`)})`
      );
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [results, totalResult] = await Promise.all([
      db.query.equipment.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: pagination.limit,
        offset,
        orderBy: (equipmentTab, { asc }) => [asc(equipmentTab.name)],
        with: {
          // Payload compression: only fetch needed columns from relations
          location: {
            columns: { id: true, name: true, code: true },
          },
          owner: {
            columns: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(equipmentTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const total = Number(totalResult[0].count);
    return apiSuccessPaginated(
      results,
      {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
      { cacheDuration: 30 } // 30 second cache for equipment list
    );
  } catch (error) {
    return handleApiError(error, requestId, "Get equipment error");
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `equipment:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    await requireCsrf(request);
    await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

    const body = await request.json();
    const result = createEquipmentSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid input data", requestId);
    }

    const [newItem] = await db
      .insert(equipmentTable)
      .values(result.data)
      .returning();

    return apiSuccess(newItem, HttpStatus.CREATED, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (
        error.message === "Forbidden" ||
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error({ requestId, error }, "Create equipment error");
    return ApiErrors.internal(error, requestId);
  }
}

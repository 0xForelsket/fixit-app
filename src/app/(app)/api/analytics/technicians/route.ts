import { db } from "@/db";
import { roles, users, workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  // Rate limiting for expensive analytics queries
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(
    `analytics:${clientIp}`,
    RATE_LIMITS.analytics.limit,
    RATE_LIMITS.analytics.windowMs
  );

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    return ApiErrors.rateLimited(retryAfter, requestId);
  }

  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to last 30 days if no date range specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        resolvedCount: sql<number>`count(CASE WHEN (${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed') AND ${workOrders.createdAt} >= ${startDate} AND ${workOrders.createdAt} <= ${endDate} THEN 1 END)`,
        activeCount: sql<number>`count(CASE WHEN (${workOrders.status} = 'open' OR ${workOrders.status} = 'in_progress') AND ${workOrders.createdAt} >= ${startDate} AND ${workOrders.createdAt} <= ${endDate} THEN 1 END)`,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(workOrders, eq(users.id, workOrders.assignedToId))
      .where(eq(roles.name, "tech"))
      .groupBy(users.id);

    return apiSuccess(
      result.map((r) => ({
        ...r,
        resolvedCount: Number(r.resolvedCount),
        activeCount: Number(r.activeCount),
      })),
      undefined,
      undefined,
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    apiLogger.error({ requestId, error }, "Tech stats error");
    return ApiErrors.internal(error, requestId);
  }
}

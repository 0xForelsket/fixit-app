import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { and, eq, gte, sql } from "drizzle-orm";

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
    const technicianId = searchParams.get("technicianId");

    // Default to last 30 days if no date range specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build conditions
    const conditions = [gte(workOrders.createdAt, startDate)];
    if (technicianId) {
      conditions.push(eq(workOrders.assignedToId, technicianId));
    }

    const trendResult = await db
      .select({
        day: sql<string>`to_char(${workOrders.createdAt}, 'YYYY-MM-DD')`.as(
          "day"
        ),
        created_count: sql<number>`count(*)`,
        resolved_count: sql<number>`count(CASE WHEN ${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed' THEN 1 END)`,
      })
      .from(workOrders)
      .where(and(...conditions))
      .groupBy(sql`day`)
      .orderBy(sql`day ASC`);

    return apiSuccess(
      trendResult.map((t) => ({
        ...t,
        created_count: Number(t.created_count),
        resolved_count: Number(t.resolved_count),
      })),
      undefined,
      undefined,
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    apiLogger.error({ requestId, error }, "Trends error");
    return ApiErrors.internal(error, requestId);
  }
}

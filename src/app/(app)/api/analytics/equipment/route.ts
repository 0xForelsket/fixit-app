import { db } from "@/db";
import { equipment, workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { desc, eq, sql } from "drizzle-orm";

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
    const result = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        breakdowns:
          sql<number>`count(CASE WHEN ${workOrders.type} = 'breakdown' THEN 1 END)`.as(
            "breakdowns"
          ),
        totalWorkOrders: sql<number>`count(${workOrders.id})`,
      })
      .from(equipment)
      .leftJoin(workOrders, eq(equipment.id, workOrders.equipmentId))
      .groupBy(equipment.id)
      .orderBy(desc(sql`breakdowns`))
      .limit(10);

    // Mock downtime for now (random hours for demo/MVP)
    const equipmentWithMockDowntime = result.map((m) => ({
      ...m,
      breakdowns: Number(m.breakdowns),
      totalWorkOrders: Number(m.totalWorkOrders),
      downtimeHours: Number(m.breakdowns) * 2 + Math.floor(Math.random() * 5), // Mock logic: ~2h per breakdown + noise
    }));

    return apiSuccess(equipmentWithMockDowntime, undefined, undefined, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Equipment analytics error");
    return ApiErrors.internal(error, requestId);
  }
}

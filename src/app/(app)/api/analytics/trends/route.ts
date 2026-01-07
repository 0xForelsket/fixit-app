import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { gte, sql } from "drizzle-orm";

export async function GET() {
  const requestId = generateRequestId();
  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trendResult = await db
      .select({
        day: sql<string>`to_char(${workOrders.createdAt}, 'YYYY-MM-DD')`.as(
          "day"
        ),
        created_count: sql<number>`count(*)`,
        resolved_count: sql<number>`count(CASE WHEN ${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed' THEN 1 END)`,
      })
      .from(workOrders)
      .where(gte(workOrders.createdAt, thirtyDaysAgo))
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

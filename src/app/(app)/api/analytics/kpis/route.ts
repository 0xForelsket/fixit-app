import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { sql } from "drizzle-orm";

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

    // Build dynamic WHERE clause conditions
    const dateCondition = sql`${workOrders.createdAt} >= ${startDate} AND ${workOrders.createdAt} <= ${endDate}`;
    const technicianCondition = technicianId
      ? sql`AND ${workOrders.assignedToId} = ${technicianId}`
      : sql``;

    // Calculate all KPIs in a single efficient SQL query
    const result = await db.execute(sql`
      SELECT
        -- 1. Open Work Orders (Backlog)
        COUNT(*) FILTER (WHERE ${workOrders.status} IN ('open', 'in_progress'))::int as open_count,
        
        -- 2. Critical/High Priority Open
        COUNT(*) FILTER (WHERE 
          ${workOrders.status} IN ('open', 'in_progress') AND 
          ${workOrders.priority} IN ('critical', 'high')
        )::int as high_priority_count,
        
        -- 3. MTTR (Mean Time To Repair) within date range
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${workOrders.resolvedAt} - ${workOrders.createdAt}))
          ) FILTER (
            WHERE ${workOrders.status} = 'resolved' 
            AND ${workOrders.resolvedAt} >= ${startDate}
            AND ${workOrders.resolvedAt} <= ${endDate}
          ), 
          0
        ) as avg_resolution_seconds,
        
        -- 4. SLA Compliance Rate data within date range
        COUNT(*) FILTER (
          WHERE ${workOrders.status} = 'resolved' 
          AND ${workOrders.resolvedAt} >= ${startDate}
          AND ${workOrders.resolvedAt} <= ${endDate}
        )::int as resolved_count,
        
        -- Count compliant (resolved <= dueBy or dueBy is null)
        COUNT(*) FILTER (
          WHERE ${workOrders.status} = 'resolved' 
          AND ${workOrders.resolvedAt} >= ${startDate}
          AND ${workOrders.resolvedAt} <= ${endDate}
          AND (${workOrders.resolvedAt} <= ${workOrders.dueBy} OR ${workOrders.dueBy} IS NULL)
        )::int as sla_compliant_count

      FROM ${workOrders}
      WHERE ${dateCondition} ${technicianCondition}
    `);

    const row = result[0]; // Postgres-js returns array of rows

    // Process results
    const mttrHours = Math.round(Number(row.avg_resolution_seconds) / 3600);

    const resolvedCount = Number(row.resolved_count);
    const compliantCount = Number(row.sla_compliant_count);

    const slaRate =
      resolvedCount > 0
        ? Math.round((compliantCount / resolvedCount) * 100)
        : 100;

    return apiSuccess(
      {
        openWorkOrders: Number(row.open_count),
        highPriorityOpen: Number(row.high_priority_count),
        mttrHours,
        slaRate,
        period: "30d",
      },
      undefined,
      undefined,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    apiLogger.error({ requestId, error }, "KPIs error");
    return ApiErrors.internal(error, requestId);
  }
}

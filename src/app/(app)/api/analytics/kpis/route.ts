import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { sql } from "drizzle-orm";

export async function GET() {
  const requestId = generateRequestId();
  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
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
        
        -- 3. MTTR (Mean Time To Repair) - Last 30 days
        -- COALESCE to 0 to handle case with no resolved tickets
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${workOrders.resolvedAt} - ${workOrders.createdAt}))
          ) FILTER (
            WHERE ${workOrders.status} = 'resolved' 
            AND ${workOrders.resolvedAt} > NOW() - INTERVAL '30 days'
          ), 
          0
        ) as avg_resolution_seconds,
        
        -- 4. SLA Compliance Rate data
        -- Count resolved in last 30d
        COUNT(*) FILTER (
          WHERE ${workOrders.status} = 'resolved' 
          AND ${workOrders.resolvedAt} > NOW() - INTERVAL '30 days'
        )::int as resolved_30d_count,
        
        -- Count compliant in last 30d (resolved <= dueBy or dueBy is null)
        COUNT(*) FILTER (
          WHERE ${workOrders.status} = 'resolved' 
          AND ${workOrders.resolvedAt} > NOW() - INTERVAL '30 days'
          AND (${workOrders.resolvedAt} <= ${workOrders.dueBy} OR ${workOrders.dueBy} IS NULL)
        )::int as sla_compliant_count

      FROM ${workOrders}
    `);

    const row = result[0]; // Postgres-js returns array of rows

    // Process results
    const mttrHours = Math.round(Number(row.avg_resolution_seconds) / 3600);

    const resolvedCount = Number(row.resolved_30d_count);
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

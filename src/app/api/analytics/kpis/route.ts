import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { and, gt, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Open Work Orders (Backlog)
    // Count work orders where status is 'open' or 'in_progress'
    const backlogResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(
        sql`${workOrders.status} = 'open' OR ${workOrders.status} = 'in_progress'`
      );
    const openWorkOrders = backlogResult[0].count;

    // 2. Critical/High Priority Open
    const priorityResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(
        and(
          sql`${workOrders.status} = 'open' OR ${workOrders.status} = 'in_progress'`,
          sql`${workOrders.priority} = 'critical' OR ${workOrders.priority} = 'high'`
        )
      );
    const highPriorityOpen = priorityResult[0].count;

    // 3. MTTR (Mean Time To Repair) - Last 30 days
    // Avg(resolvedAt - createdAt) where status is resolved/closed
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedWorkOrders = await db
      .select({
        created: workOrders.createdAt,
        resolved: workOrders.resolvedAt,
      })
      .from(workOrders)
      .where(
        and(
          isNotNull(workOrders.resolvedAt),
          gt(workOrders.resolvedAt, thirtyDaysAgo)
        )
      );

    let mttrHours = 0;
    if (resolvedWorkOrders.length > 0) {
      const totalDurationMs = resolvedWorkOrders.reduce((acc, t) => {
        return acc + (t.resolved!.getTime() - t.created.getTime());
      }, 0);
      mttrHours = Math.round(
        totalDurationMs / (1000 * 60 * 60) / resolvedWorkOrders.length
      );
    }

    // 4. SLA Compliance Rate
    // % of resolved work orders (last 30 days) where resolvedAt <= dueBy
    const _compliantWorkOrders = resolvedWorkOrders.filter((_t) => {
      // We'll need to re-query or update the select above to include dueBy
      // For efficiency, let's just do it in one query if possible, but JS filter is fine for small scale
      return true; // Placeholder until we fetch dueBy
    });

    // Let's re-fetch with dueBy
    const resolvedWithDue = await db
      .select({
        created: workOrders.createdAt,
        resolved: workOrders.resolvedAt,
        dueBy: workOrders.dueBy,
      })
      .from(workOrders)
      .where(
        and(
          isNotNull(workOrders.resolvedAt),
          gt(workOrders.resolvedAt, thirtyDaysAgo)
        )
      );

    const slaCompliantCount = resolvedWithDue.filter((t) => {
      if (!t.dueBy) return true; // Default to compliant if no due date
      return t.resolved! <= t.dueBy;
    }).length;

    const slaRate =
      resolvedWithDue.length > 0
        ? Math.round((slaCompliantCount / resolvedWithDue.length) * 100)
        : 100;

    return NextResponse.json({
      openWorkOrders,
      highPriorityOpen,
      mttrHours,
      slaRate,
      period: "30d",
    });
  } catch (error) {
    console.error("KPIs error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

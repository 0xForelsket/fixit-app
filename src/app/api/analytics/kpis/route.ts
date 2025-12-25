import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, gt, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Open Tickets (Backlog)
    // Count tickets where status is 'open' or 'in_progress'
    const backlogResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        sql`${tickets.status} = 'open' OR ${tickets.status} = 'in_progress'`
      );
    const openTickets = backlogResult[0].count;

    // 2. Critical/High Priority Open
    const priorityResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        and(
          sql`${tickets.status} = 'open' OR ${tickets.status} = 'in_progress'`,
          sql`${tickets.priority} = 'critical' OR ${tickets.priority} = 'high'`
        )
      );
    const highPriorityOpen = priorityResult[0].count;

    // 3. MTTR (Mean Time To Repair) - Last 30 days
    // Avg(resolvedAt - createdAt) where status is resolved/closed
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedTickets = await db
      .select({
        created: tickets.createdAt,
        resolved: tickets.resolvedAt,
      })
      .from(tickets)
      .where(
        and(
          isNotNull(tickets.resolvedAt),
          gt(tickets.resolvedAt, thirtyDaysAgo)
        )
      );

    let mttrHours = 0;
    if (resolvedTickets.length > 0) {
      const totalDurationMs = resolvedTickets.reduce((acc, t) => {
        return acc + (t.resolved!.getTime() - t.created.getTime());
      }, 0);
      mttrHours = Math.round(
        totalDurationMs / (1000 * 60 * 60) / resolvedTickets.length
      );
    }

    // 4. SLA Compliance Rate
    // % of resolved tickets (last 30 days) where resolvedAt <= dueBy
    const compliantTickets = resolvedTickets.filter((t) => {
      // We'll need to re-query or update the select above to include dueBy
      // For efficiency, let's just do it in one query if possible, but JS filter is fine for small scale
      return true; // Placeholder until we fetch dueBy
    });

    // Let's re-fetch with dueBy
    const resolvedWithDue = await db
      .select({
        created: tickets.createdAt,
        resolved: tickets.resolvedAt,
        dueBy: tickets.dueBy,
      })
      .from(tickets)
      .where(
        and(
          isNotNull(tickets.resolvedAt),
          gt(tickets.resolvedAt, thirtyDaysAgo)
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
      openTickets,
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

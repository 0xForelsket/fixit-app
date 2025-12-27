import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const trendResult = await db
      .select({
        day: sql<string>`date(${workOrders.createdAt}, 'unixepoch')`.as("day"),
        created_count: sql<number>`count(*)`,
        resolved_count: sql<number>`count(CASE WHEN ${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed' THEN 1 END)`,
      })
      .from(workOrders)
      .where(sql`${workOrders.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`day`)
      .orderBy(sql`day ASC`);

    return NextResponse.json(
      trendResult.map((t) => ({
        ...t,
        created_count: Number(t.created_count),
        resolved_count: Number(t.resolved_count),
      }))
    );
  } catch (error) {
    console.error("Trends error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

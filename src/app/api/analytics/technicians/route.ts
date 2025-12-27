import { db } from "@/db";
import { roles, workOrders, users } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        resolvedCount: sql<number>`count(CASE WHEN ${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed' THEN 1 END)`,
        activeCount: sql<number>`count(CASE WHEN ${workOrders.status} = 'open' OR ${workOrders.status} = 'in_progress' THEN 1 END)`,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(workOrders, eq(users.id, workOrders.assignedToId))
      .where(eq(roles.name, "tech"))
      .groupBy(users.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tech stats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

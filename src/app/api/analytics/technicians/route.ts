import { db } from "@/db";
import { tickets, users } from "@/db/schema";
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
    // Technician Performance
    // List all techs with ticket counts
    // We want: Name, Resolved Count, active count

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        resolvedCount: sql<number>`count(CASE WHEN ${tickets.status} = 'resolved' OR ${tickets.status} = 'closed' THEN 1 END)`,
        activeCount: sql<number>`count(CASE WHEN ${tickets.status} = 'open' OR ${tickets.status} = 'in_progress' THEN 1 END)`,
      })
      .from(users)
      .leftJoin(tickets, eq(users.id, tickets.assignedToId))
      .where(eq(users.role, "tech"))
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

import { db } from "@/db";
import { equipment, workOrders } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      downtimeHours: Number(m.breakdowns) * 2 + Math.floor(Math.random() * 5), // Mock logic: ~2h per breakdown + noise
    }));

    return NextResponse.json(equipmentWithMockDowntime);
  } catch (error) {
    console.error("Equipment analytics error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

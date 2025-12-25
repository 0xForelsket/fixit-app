import { db } from "@/db";
import { equipment, tickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Equipment Health Rankings
    // Top equipment by Breakdown Count (last 90 days?)
    // Return: id, name, code, breakdowns, downtime (mocked for now as we don't have status logs fully populating yet)

    // We'll count tickets of type 'breakdown'
    const result = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        breakdowns: sql<number>`count(CASE WHEN ${tickets.type} = 'breakdown' THEN 1 END)`,
        totalTickets: sql<number>`count(${tickets.id})`,
      })
      .from(equipment)
      .leftJoin(tickets, eq(equipment.id, tickets.equipmentId))
      .groupBy(equipment.id)
      .orderBy(sql`breakdowns DESC`)
      .limit(10);

    // Mock downtime for now (random hours for demo/MVP)
    const equipmentWithMockDowntime = result.map((m) => ({
      ...m,
      downtimeHours: m.breakdowns * 2 + Math.floor(Math.random() * 5), // Mock logic: ~2h per breakdown + noise
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

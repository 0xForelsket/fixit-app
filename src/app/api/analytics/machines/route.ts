import { db } from "@/db";
import { machines, tickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "operator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Machine Health Rankings
    // Top machines by Breakdown Count (last 90 days?)
    // Return: id, name, code, breakdowns, downtime (mocked for now as we don't have status logs fully populating yet)

    // We'll count tickets of type 'breakdown'
    const result = await db
      .select({
        id: machines.id,
        name: machines.name,
        code: machines.code,
        breakdowns: sql<number>`count(CASE WHEN ${tickets.type} = 'breakdown' THEN 1 END)`,
        totalTickets: sql<number>`count(${tickets.id})`,
      })
      .from(machines)
      .leftJoin(tickets, eq(machines.id, tickets.machineId))
      .groupBy(machines.id)
      .orderBy(sql`breakdowns DESC`)
      .limit(10);

    // Mock downtime for now (random hours for demo/MVP)
    const machinesWithMockDowntime = result.map((m) => ({
      ...m,
      downtimeHours: m.breakdowns * 2 + Math.floor(Math.random() * 5), // Mock logic: ~2h per breakdown + noise
    }));

    return NextResponse.json(machinesWithMockDowntime);
  } catch (error) {
    console.error("Machine analytics error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

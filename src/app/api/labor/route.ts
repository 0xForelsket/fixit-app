import { db } from "@/db";
import { laborLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// POST /api/labor - Create new labor log
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticketId,
      userId,
      startTime,
      endTime,
      durationMinutes,
      hourlyRate,
      notes,
      isBillable,
    } = body;

    if (!ticketId || !userId || !durationMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(laborLogs)
      .values({
        ticketId,
        userId,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        durationMinutes,
        hourlyRate,
        notes,
        isBillable: isBillable ?? true,
      })
      .returning();

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating labor log:", error);
    return NextResponse.json(
      { error: "Failed to create labor log" },
      { status: 500 }
    );
  }
}

// GET /api/labor - List labor logs (with optional ticketId filter)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    const logs = await db.query.laborLogs.findMany({
      where: ticketId
        ? (laborLogs, { eq }) =>
            eq(laborLogs.ticketId, Number.parseInt(ticketId))
        : undefined,
      with: {
        user: true,
        ticket: true,
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching labor logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch labor logs" },
      { status: 500 }
    );
  }
}

import { db } from "@/db";
import { laborLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
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
      workOrderId,
      userId,
      startTime,
      endTime,
      durationMinutes,
      hourlyRate,
      notes,
      isBillable,
    } = body;

    if (!workOrderId || !userId || !durationMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(laborLogs)
      .values({
        workOrderId,
        userId,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        durationMinutes,
        hourlyRate,
        notes,
        isBillable: isBillable ?? true,
      })
      .returning();

    revalidatePath(`/maintenance/work-orders/${workOrderId}`);
    revalidatePath("/maintenance/work-orders");

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating labor log:", error);
    return NextResponse.json(
      { error: "Failed to create labor log" },
      { status: 500 }
    );
  }
}

// GET /api/labor - List labor logs (with optional workOrderId filter)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get("workOrderId");

    const logs = await db.query.laborLogs.findMany({
      where: workOrderId
        ? (laborLogs, { eq }) =>
            eq(laborLogs.workOrderId, Number.parseInt(workOrderId))
        : undefined,
      with: {
        user: true,
        workOrder: true,
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

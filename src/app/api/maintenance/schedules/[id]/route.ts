import { db } from "@/db";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/maintenance/schedules/[id] - Get single schedule
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = Number.parseInt(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    const schedule = await db.query.maintenanceSchedules.findFirst({
      where: eq(maintenanceSchedules.id, scheduleId),
      with: {
        machine: {
          with: {
            location: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const checklists = await db.query.maintenanceChecklists.findMany({
      where: eq(maintenanceChecklists.scheduleId, scheduleId),
      orderBy: (c, { asc }) => [asc(c.stepNumber)],
    });

    return NextResponse.json({ schedule, checklists });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// PATCH /api/maintenance/schedules/[id] - Update schedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "tech")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = Number.parseInt(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, machineId, type, frequencyDays, isActive, checklists } =
      body;

    // Update schedule
    const [schedule] = await db
      .update(maintenanceSchedules)
      .set({
        title,
        machineId,
        type,
        frequencyDays,
        isActive,
      })
      .where(eq(maintenanceSchedules.id, scheduleId))
      .returning();

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Update checklists - delete existing and insert new
    if (checklists) {
      await db
        .delete(maintenanceChecklists)
        .where(eq(maintenanceChecklists.scheduleId, scheduleId));

      if (checklists.length > 0) {
        await db.insert(maintenanceChecklists).values(
          checklists.map(
            (item: {
              stepNumber: number;
              description: string;
              isRequired: boolean;
              estimatedMinutes: number | null;
            }) => ({
              scheduleId: scheduleId,
              stepNumber: item.stepNumber,
              description: item.description,
              isRequired: item.isRequired,
              estimatedMinutes: item.estimatedMinutes,
            })
          )
        );
      }
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance/schedules/[id] - Delete schedule
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "tech")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const scheduleId = Number.parseInt(id);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      );
    }

    // Delete checklists first (foreign key constraint)
    await db
      .delete(maintenanceChecklists)
      .where(eq(maintenanceChecklists.scheduleId, scheduleId));

    // Delete schedule
    const [deleted] = await db
      .delete(maintenanceSchedules)
      .where(eq(maintenanceSchedules.id, scheduleId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}

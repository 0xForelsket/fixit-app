import { db } from "@/db";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// POST /api/maintenance/schedules - Create new schedule
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "tech")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, machineId, type, frequencyDays, isActive, checklists } =
      body;

    if (!title || !machineId || !type || !frequencyDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + frequencyDays);

    // Create schedule
    const [schedule] = await db
      .insert(maintenanceSchedules)
      .values({
        title,
        machineId,
        type,
        frequencyDays,
        isActive: isActive ?? true,
        nextDue,
      })
      .returning();

    // Create checklist items if provided
    if (checklists && checklists.length > 0) {
      await db.insert(maintenanceChecklists).values(
        checklists.map(
          (item: {
            stepNumber: number;
            description: string;
            isRequired: boolean;
            estimatedMinutes: number | null;
          }) => ({
            scheduleId: schedule.id,
            stepNumber: item.stepNumber,
            description: item.description,
            isRequired: item.isRequired,
            estimatedMinutes: item.estimatedMinutes,
          })
        )
      );
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

// GET /api/maintenance/schedules - List all schedules
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await db.query.maintenanceSchedules.findMany({
      with: {
        machine: {
          with: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

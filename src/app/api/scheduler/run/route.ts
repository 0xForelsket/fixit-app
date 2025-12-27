import { db } from "@/db";
import {
  checklistCompletions,
  maintenanceChecklists,
  maintenanceSchedules,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Authorization: Hybrid approach (Cron Secret OR Authenticated Session)
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else {
      const user = await getCurrentUser();
      if (user && userHasPermission(user, PERMISSIONS.SYSTEM_SCHEDULER)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find due schedules
    const now = new Date();
    const pendingSchedules = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          lte(maintenanceSchedules.nextDue, now)
        )
      );

    if (pendingSchedules.length === 0) {
      return NextResponse.json({ message: "No schedules due", generated: 0 });
    }

    let generatedCount = 0;
    const errors: string[] = [];

    // 3. Process each schedule
    for (const schedule of pendingSchedules) {
      try {
        await db.transaction(async (tx) => {
          // Find a system user (admin) to report work orders
          const allUsers = await tx.query.users.findMany({
            with: { assignedRole: true },
          });
          const systemUser = allUsers.find(
            (u) => u.assignedRole?.name === "admin"
          );
          const reportedById = systemUser?.id || 1;

          // A. Create Work Order
          const [newWorkOrder] = await tx
            .insert(workOrders)
            .values({
              equipmentId: schedule.equipmentId,
              title: `Scheduled: ${schedule.title}`,
              description: `Auto-generated maintenance work order from schedule #${schedule.id}`,
              type: schedule.type,
              priority: "medium", // Default priority for scheduled tasks
              status: "open",
              reportedById: reportedById,
            })
            .returning();

          // B. Copy Checklist Items
          const checklists = await tx
            .select()
            .from(maintenanceChecklists)
            .where(eq(maintenanceChecklists.scheduleId, schedule.id));

          if (checklists.length > 0) {
            await tx.insert(checklistCompletions).values(
              checklists.map((item) => ({
                checklistId: item.id,
                workOrderId: newWorkOrder.id,
                status: "pending" as const,
              }))
            );
          }

          // C. Update Schedule
          // Calculate next due date from NOW to avoid drift stacking if system was off
          const nextDueDate = new Date(now);
          nextDueDate.setDate(nextDueDate.getDate() + schedule.frequencyDays);

          await tx
            .update(maintenanceSchedules)
            .set({
              lastGenerated: now,
              nextDue: nextDueDate,
            })
            .where(eq(maintenanceSchedules.id, schedule.id));

          // D. Create Notifications (for all Techs and Admins)
          // TODO: Implement notification logic in future phase
          // Currently relying on dashboard "Active Tickets" for visibility

          generatedCount++;
        });
      } catch (err) {
        console.error(`Failed to process schedule ${schedule.id}:`, err);
        errors.push(
          `Schedule ${schedule.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return NextResponse.json({
      message: "Scheduler run complete",
      generated: generatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Scheduler fatal error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

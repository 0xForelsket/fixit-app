import { db } from "@/db";
import {
  checklistCompletions,
  equipment,
  maintenanceChecklists,
  maintenanceSchedules,
  roles,
  users,
  workOrders,
} from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { generateRequestId, schedulerLogger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser, requireCsrf } from "@/lib/session";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // 1. Authorization: Hybrid approach (Cron Secret OR Authenticated Session)
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorized = false;
    let isCronJob = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
      isCronJob = true;
    } else {
      // For user-triggered runs, require CSRF protection
      await requireCsrf(request);

      const user = await getCurrentUser();
      if (user && userHasPermission(user, PERMISSIONS.SYSTEM_SCHEDULER)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return ApiErrors.unauthorized(requestId);
    }

    // Rate limiting for manual triggers (not cron jobs)
    if (!isCronJob) {
      const clientIp = getClientIp(request);
      const rateLimit = checkRateLimit(
        `scheduler:${clientIp}`,
        5, // 5 manual runs per minute
        60 * 1000
      );
      if (!rateLimit.success) {
        const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
        return ApiErrors.rateLimited(retryAfter, requestId);
      }
    }

    const now = new Date();
    let generatedCount = 0;
    let escalatedCount = 0;
    const errors: string[] = [];

    // 2. Find due schedules
    const pendingSchedules = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.isActive, true),
          lt(maintenanceSchedules.nextDue, now)
        )
      );

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
          const reportedById =
            systemUser?.id || "00000000-0000-0000-0000-000000000000";

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
          nextDueDate.setDate(
            nextDueDate.getDate() + (schedule.frequencyDays ?? 0)
          );

          await tx
            .update(maintenanceSchedules)
            .set({
              lastGenerated: now,
              nextDue: nextDueDate,
            })
            .where(eq(maintenanceSchedules.id, schedule.id));

          generatedCount++;
        });
      } catch (err) {
        schedulerLogger.error(
          { requestId, scheduleId: schedule.id, error: err },
          "Failed to process schedule"
        );
        errors.push(
          `Schedule ${schedule.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // 4. Check for work orders that need escalation (SLA breached)
    const workOrdersToEscalate = await db
      .select()
      .from(workOrders)
      .where(
        and(
          inArray(workOrders.status, ["open", "in_progress"]),
          lt(workOrders.dueBy, now),
          isNull(workOrders.escalatedAt)
        )
      );

    // Get admin role for notification targeting
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "admin"),
    });

    const admins = adminRole
      ? await db.query.users.findMany({
          where: and(eq(users.roleId, adminRole.id), eq(users.isActive, true)),
        })
      : [];

    for (const wo of workOrdersToEscalate) {
      try {
        // Mark as escalated
        await db
          .update(workOrders)
          .set({ escalatedAt: now, updatedAt: now })
          .where(eq(workOrders.id, wo.id));

        // Get equipment info for notification message
        const equipmentItem = wo.equipmentId
          ? await db.query.equipment.findFirst({
              where: eq(equipment.id, wo.equipmentId),
            })
          : null;

        const equipmentName = equipmentItem?.name || "Unknown Equipment";

        // Notify admins about escalation
        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: "work_order_escalated",
            title: "Work Order Escalated - SLA Breached",
            message: `${wo.title} - ${equipmentName} is overdue`,
            link: `/maintenance/work-orders/${wo.id}`,
          });
        }

        // Also notify the assigned technician if any
        if (wo.assignedToId) {
          await createNotification({
            userId: wo.assignedToId,
            type: "work_order_escalated",
            title: "Your Work Order Has Been Escalated",
            message: `${wo.title} - SLA breached, please prioritize`,
            link: `/maintenance/work-orders/${wo.id}`,
          });
        }

        escalatedCount++;
      } catch (err) {
        schedulerLogger.error(
          { requestId, workOrderId: wo.id, error: err },
          "Failed to escalate work order"
        );
        errors.push(
          `Escalation WO ${wo.id}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    schedulerLogger.info(
      {
        requestId,
        generated: generatedCount,
        escalated: escalatedCount,
        errorCount: errors.length,
      },
      "Scheduler run complete"
    );

    return apiSuccess({
      message: "Scheduler run complete",
      generated: generatedCount,
      escalated: escalatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    schedulerLogger.error({ requestId, error: err }, "Scheduler fatal error");
    return ApiErrors.internal(err, requestId);
  }
}

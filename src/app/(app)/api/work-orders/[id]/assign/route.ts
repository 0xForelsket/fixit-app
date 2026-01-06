import { db } from "@/db";
import { notifications, workOrderLogs, workOrders } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { requireAuth, requireCsrf } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const assignSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: workOrderId } = await params;

  try {
    await requireCsrf(request);
    const user = await requireAuth();

    if (!userHasPermission(user, PERMISSIONS.TICKET_ASSIGN)) {
      return ApiErrors.forbidden(requestId);
    }

    const body = await request.json();
    const result = assignSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid assignedToId", requestId);
    }

    // Find by UUID or displayId
    const isDisplayId = /^\d+$/.test(workOrderId);
    const existing = await db.query.workOrders.findFirst({
      where: isDisplayId
        ? eq(workOrders.displayId, Number.parseInt(workOrderId, 10))
        : eq(workOrders.id, workOrderId),
    });

    if (!existing) {
      return ApiErrors.notFound("Work order", requestId);
    }

    const { assignedToId } = result.data;

    // No change needed
    if (assignedToId === existing.assignedToId) {
      return apiSuccess(
        { message: "No changes made" },
        HttpStatus.OK,
        requestId
      );
    }

    // Update the work order
    const [updated] = await db
      .update(workOrders)
      .set({
        assignedToId,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, existing.id))
      .returning();

    // Log the assignment
    await db.insert(workOrderLogs).values({
      workOrderId: existing.id,
      action: "assignment",
      oldValue: existing.assignedToId?.toString() || "unassigned",
      newValue: assignedToId?.toString() || "unassigned",
      createdById: user.id,
    });

    // Notify newly assigned user
    if (assignedToId && assignedToId !== user.id) {
      await db.insert(notifications).values({
        userId: assignedToId,
        type: "work_order_assigned",
        title: "Work Order Assigned to You",
        message: existing.title,
        link: `/maintenance/work-orders/${existing.displayId}`,
      });
    }

    revalidatePath(`/maintenance/work-orders/${existing.displayId}`);
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/dashboard");

    apiLogger.info(
      {
        requestId,
        workOrderId: existing.id,
        assignedToId,
        previousAssignee: existing.assignedToId,
        userId: user.id,
      },
      "Work order assigned via API"
    );

    return apiSuccess(updated, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return ApiErrors.unauthorized(requestId);
      }
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return ApiErrors.forbidden(requestId);
      }
    }
    apiLogger.error(
      { requestId, workOrderId, error },
      "Assign work order error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

import { db } from "@/db";
import { notifications, workOrderLogs, workOrders } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { requireAuth, requireCsrf } from "@/lib/session";
import { updateWorkOrderSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: workOrderId } = await params;

  try {
    const user = await requireAuth();

    // Try to find by UUID or displayId
    const isDisplayId = /^\d+$/.test(workOrderId);

    const workOrder = await db.query.workOrders.findFirst({
      where: isDisplayId
        ? eq(workOrders.displayId, Number.parseInt(workOrderId, 10))
        : eq(workOrders.id, workOrderId),
      with: {
        equipment: {
          columns: { id: true, name: true, code: true, status: true },
          with: {
            location: { columns: { id: true, name: true } },
          },
        },
        reportedBy: {
          columns: { id: true, name: true, employeeId: true },
        },
        assignedTo: {
          columns: { id: true, name: true, employeeId: true },
        },
        logs: {
          with: {
            createdBy: { columns: { id: true, name: true } },
          },
          orderBy: (logs, { desc }) => [desc(logs.createdAt)],
          limit: 50,
        },
        parts: {
          with: {
            part: { columns: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!workOrder) {
      return ApiErrors.notFound("Work order", requestId);
    }

    // Check if user can view this work order
    if (!userHasPermission(user, PERMISSIONS.TICKET_VIEW_ALL)) {
      if (
        workOrder.reportedById !== user.id &&
        workOrder.assignedToId !== user.id
      ) {
        return ApiErrors.forbidden(requestId);
      }
    }

    return apiSuccess(workOrder, HttpStatus.OK, requestId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    apiLogger.error({ requestId, workOrderId, error }, "Get work order error");
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const { id: workOrderId } = await params;

  try {
    await requireCsrf(request);
    const user = await requireAuth();

    if (!userHasPermission(user, PERMISSIONS.TICKET_UPDATE)) {
      return ApiErrors.forbidden(requestId);
    }

    const body = await request.json();
    const result = updateWorkOrderSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid input data", requestId);
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

    const updateData: Record<string, unknown> = {
      ...result.data,
      updatedAt: new Date(),
    };

    // Set resolvedAt if status is being changed to resolved
    if (result.data.status === "resolved" && existing.status !== "resolved") {
      updateData.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, existing.id))
      .returning();

    // Log status changes
    if (result.data.status && result.data.status !== existing.status) {
      await db.insert(workOrderLogs).values({
        workOrderId: existing.id,
        action: "status_change",
        oldValue: existing.status,
        newValue: result.data.status,
        createdById: user.id,
      });
    }

    // Log assignment changes
    if (
      result.data.assignedToId !== undefined &&
      result.data.assignedToId !== existing.assignedToId
    ) {
      await db.insert(workOrderLogs).values({
        workOrderId: existing.id,
        action: "assignment",
        oldValue: existing.assignedToId?.toString() || null,
        newValue: result.data.assignedToId?.toString() || "unassigned",
        createdById: user.id,
      });

      // Notify newly assigned user
      if (result.data.assignedToId) {
        await db.insert(notifications).values({
          userId: result.data.assignedToId,
          type: "work_order_assigned",
          title: "Work Order Assigned to You",
          message: existing.title,
          link: `/maintenance/work-orders/${existing.displayId}`,
        });
      }
    }

    revalidatePath(`/maintenance/work-orders/${existing.displayId}`);
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/dashboard");

    apiLogger.info(
      { requestId, workOrderId: existing.id, userId: user.id },
      "Work order updated via API"
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
      "Update work order error"
    );
    return ApiErrors.internal(error, requestId);
  }
}

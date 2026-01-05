import { db } from "@/db";
import {
  downtimeLogs,
  equipment as equipmentTable,
  notifications,
  roles,
  users,
  workOrders,
} from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth, requireCsrf } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import { createWorkOrderSchema, paginationSchema } from "@/lib/validations";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const equipmentId = searchParams.get("equipmentId");
    const assignedToId = searchParams.get("assignedToId");

    const conditions = [];

    if (status) {
      const statuses = status.split(",");
      conditions.push(
        inArray(
          workOrders.status,
          statuses as (typeof workOrders.status.enumValues)[number][]
        )
      );
    }

    if (priority) {
      conditions.push(
        eq(
          workOrders.priority,
          priority as (typeof workOrders.priority.enumValues)[number]
        )
      );
    }

    if (equipmentId) {
      conditions.push(eq(workOrders.equipmentId, equipmentId));
    }

    if (assignedToId) {
      conditions.push(eq(workOrders.assignedToId, assignedToId));
    }

    // Users without TICKET_VIEW_ALL can only see their own work orders
    if (!userHasPermission(user, PERMISSIONS.TICKET_VIEW_ALL)) {
      conditions.push(eq(workOrders.reportedById, user.id));
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [results, totalResult] = await Promise.all([
      db.query.workOrders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: pagination.limit,
        offset,
        orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
        with: {
          // Payload compression: only fetch needed columns from relations
          equipment: {
            columns: { id: true, name: true, code: true, status: true },
          },
          reportedBy: {
            columns: { id: true, name: true, employeeId: true },
          },
          assignedTo: {
            columns: { id: true, name: true, employeeId: true },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(workOrders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    return NextResponse.json({
      data: results,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: Number(totalResult[0].count),
        totalPages: Math.ceil(Number(totalResult[0].count) / pagination.limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    apiLogger.error({ requestId, error }, "Failed to fetch work orders");
    return ApiErrors.internal(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `work-orders:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    await requireCsrf(request);
    const user = await requireAuth();

    const body = await request.json();
    const result = createWorkOrderSchema.safeParse(body);

    if (!result.success) {
      return ApiErrors.validationError("Invalid input data", requestId);
    }

    const { equipmentId, type, title, description, priority } = result.data;

    // Calculate SLA due date
    const dueBy = calculateDueBy(priority);

    // Create the work order
    const [workOrder] = await db.transaction(async (tx) => {
      const [wo] = await tx
        .insert(workOrders)
        .values({
          equipmentId,
          type,
          title,
          description,
          priority,
          reportedById: user.id,
          status: "open",
          dueBy,
        })
        .returning();

      // If this is a breakdown, automatically start downtime
      if (type === "breakdown") {
        await tx.insert(downtimeLogs).values({
          equipmentId,
          startTime: new Date(),
          reasonCode: "mechanical_failure", // Default, can be updated later
          reportedById: user.id,
          workOrderId: wo.id,
          notes: `Auto-generated from Work Order: ${title}`,
        });

        // Update equipment status to "down"
        await tx
          .update(equipmentTable)
          .set({ status: "down" })
          .where(eq(equipmentTable.id, equipmentId));
      }

      return [wo];
    });

    // Get equipment details for notifications
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
      columns: { id: true, name: true, ownerId: true },
    });

    // Notify techs for critical/high priority work orders
    if (priority === "critical" || priority === "high") {
      // Optimized: Query only tech user IDs with a single join (payload compression)
      const techUsers = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(eq(roles.name, "tech"), eq(users.isActive, true)));

      if (techUsers.length > 0) {
        await db.insert(notifications).values(
          techUsers.map((tech) => ({
            userId: tech.id,
            type: "work_order_created" as const,
            title: `New ${priority} Priority Work Order`,
            message: `${title} - ${equipmentItem?.name || "Unknown Equipment"}`,
            link: `/maintenance/work-orders/${workOrder.id}`,
          }))
        );
      }
    }

    // Notify equipment owner if exists
    if (equipmentItem?.ownerId) {
      await db.insert(notifications).values({
        userId: equipmentItem.ownerId,
        type: "work_order_created" as const,
        title: "Work Order Opened on Your Equipment",
        message: `${title} - ${equipmentItem.name}`,
        link: `/maintenance/work-orders/${workOrder.id}`,
      });
    }

    apiLogger.info(
      { requestId, workOrderId: workOrder.id, userId: user.id },
      "Work order created"
    );

    return apiSuccess(workOrder, HttpStatus.CREATED, requestId);
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
    apiLogger.error({ requestId, error }, "Failed to create work order");
    return ApiErrors.internal(error, requestId);
  }
}

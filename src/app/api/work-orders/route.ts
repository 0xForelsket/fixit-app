import { db } from "@/db";
import {
  equipment as equipmentTable,
  notifications,
  workOrders,
  users,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAuth, requireCsrf } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import { createWorkOrderSchema, paginationSchema } from "@/lib/validations";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
      conditions.push(eq(workOrders.equipmentId, Number(equipmentId)));
    }

    if (assignedToId) {
      conditions.push(eq(workOrders.assignedToId, Number(assignedToId)));
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
          equipment: true,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get work orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `work-orders:${clientIp}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowMs
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    await requireCsrf(request);
    const user = await requireAuth();

    const body = await request.json();
    const result = createWorkOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { equipmentId, type, title, description, priority } = result.data;

    // Calculate SLA due date
    const dueBy = calculateDueBy(priority);

    // Create the work order
    const [workOrder] = await db
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

    // Get equipment details for notifications
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
    });

    // Notify techs for critical/high priority work orders
    if (priority === "critical" || priority === "high") {
      const allUsers = await db.query.users.findMany({
        where: eq(users.isActive, true),
        with: { assignedRole: true },
      });
      const techs = allUsers.filter((u) => u.assignedRole?.name === "tech");

      if (techs.length > 0) {
        await db.insert(notifications).values(
          techs.map((tech) => ({
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

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Create work order error:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}

import { db } from "@/db";
import { machines, notifications, tickets, users } from "@/db/schema";
import { requireAuth, requireCsrf } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import { createTicketSchema, paginationSchema } from "@/lib/validations";
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
    const machineId = searchParams.get("machineId");
    const assignedToId = searchParams.get("assignedToId");

    const conditions = [];

    if (status) {
      const statuses = status.split(",");
      conditions.push(
        inArray(
          tickets.status,
          statuses as (typeof tickets.status.enumValues)[number][]
        )
      );
    }

    if (priority) {
      conditions.push(
        eq(
          tickets.priority,
          priority as (typeof tickets.priority.enumValues)[number]
        )
      );
    }

    if (machineId) {
      conditions.push(eq(tickets.machineId, Number(machineId)));
    }

    if (assignedToId) {
      conditions.push(eq(tickets.assignedToId, Number(assignedToId)));
    }

    // Operators can only see their own tickets
    if (user.role === "operator") {
      conditions.push(eq(tickets.reportedById, user.id));
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [results, totalResult] = await Promise.all([
      db.query.tickets.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: pagination.limit,
        offset,
        orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
        with: {
          machine: true,
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
        .from(tickets)
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
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const user = await requireAuth();

    const body = await request.json();
    const result = createTicketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { machineId, type, title, description, priority } = result.data;

    // Calculate SLA due date
    const dueBy = calculateDueBy(priority);

    // Create the ticket
    const [ticket] = await db
      .insert(tickets)
      .values({
        machineId,
        type,
        title,
        description,
        priority,
        reportedById: user.id,
        status: "open",
        dueBy,
      })
      .returning();

    // Get machine details for notifications
    const machine = await db.query.machines.findFirst({
      where: eq(machines.id, machineId),
    });

    // Notify techs for critical/high priority tickets
    if (priority === "critical" || priority === "high") {
      const techs = await db.query.users.findMany({
        where: and(eq(users.role, "tech"), eq(users.isActive, true)),
      });

      if (techs.length > 0) {
        await db.insert(notifications).values(
          techs.map((tech) => ({
            userId: tech.id,
            type: "ticket_created" as const,
            title: `New ${priority} Priority Ticket`,
            message: `${title} - ${machine?.name || "Unknown Machine"}`,
            link: `/dashboard/tickets/${ticket.id}`,
          }))
        );
      }
    }

    // Notify machine owner if exists
    if (machine?.ownerId) {
      await db.insert(notifications).values({
        userId: machine.ownerId,
        type: "ticket_created",
        title: "New Ticket for Your Machine",
        message: `${title} - ${machine.name}`,
        link: `/dashboard/tickets/${ticket.id}`,
      });
    }

    return NextResponse.json(ticket, { status: 201 });
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
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

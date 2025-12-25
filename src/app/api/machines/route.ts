import { db } from "@/db";
import { machines } from "@/db/schema";
import { requireAuth, requireCsrf, requireRole } from "@/lib/session";
import { createMachineSchema, paginationSchema } from "@/lib/validations";
import { and, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const pagination = paginationSchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const locationId = searchParams.get("locationId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [];

    if (locationId) {
      conditions.push(eq(machines.locationId, Number(locationId)));
    }

    if (status) {
      conditions.push(
        eq(
          machines.status,
          status as (typeof machines.status.enumValues)[number]
        )
      );
    }

    if (search) {
      conditions.push(
        sql`(${ilike(machines.name, `%${search}%`)} OR ${ilike(machines.code, `%${search}%`)})`
      );
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [results, totalResult] = await Promise.all([
      db.query.machines.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: pagination.limit,
        offset,
        orderBy: (machines, { asc }) => [asc(machines.name)],
        with: {
          location: true,
          owner: {
            columns: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(machines)
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
    console.error("Get machines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    await requireRole("admin");

    const body = await request.json();
    const result = createMachineSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const [machine] = await db.insert(machines).values(result.data).returning();

    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (
        error.message === "Forbidden" ||
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Create machine error:", error);
    return NextResponse.json(
      { error: "Failed to create machine" },
      { status: 500 }
    );
  }
}

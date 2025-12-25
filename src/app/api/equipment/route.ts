import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import { requireAuth, requireCsrf, requireRole } from "@/lib/session";
import { createEquipmentSchema, paginationSchema } from "@/lib/validations";
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
      conditions.push(eq(equipmentTable.locationId, Number(locationId)));
    }

    if (status) {
      conditions.push(
        eq(
          equipmentTable.status,
          status as (typeof equipmentTable.status.enumValues)[number]
        )
      );
    }

    if (search) {
      conditions.push(
        sql`(${ilike(equipmentTable.name, `%${search}%`)} OR ${ilike(equipmentTable.code, `%${search}%`)})`
      );
    }

    const offset = (pagination.page - 1) * pagination.limit;

    const [results, totalResult] = await Promise.all([
      db.query.equipment.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: pagination.limit,
        offset,
        orderBy: (equipmentTab, { asc }) => [asc(equipmentTab.name)],
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
        .from(equipmentTable)
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
    console.error("Get equipment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    await requireRole("admin");

    const body = await request.json();
    const result = createEquipmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const [newItem] = await db
      .insert(equipmentTable)
      .values(result.data)
      .returning();

    return NextResponse.json(newItem, { status: 201 });
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
    console.error("Create equipment error:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}

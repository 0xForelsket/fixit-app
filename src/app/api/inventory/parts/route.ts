import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// POST /api/inventory/parts - Create new part
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      description,
      category,
      unitCost,
      reorderPoint,
      leadTimeDays,
      isActive,
    } = body;

    if (!name || !sku || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [part] = await db
      .insert(spareParts)
      .values({
        name,
        sku,
        barcode,
        description,
        category,
        unitCost,
        reorderPoint: reorderPoint ?? 0,
        leadTimeDays,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error("Error creating part:", error);
    return NextResponse.json(
      { error: "Failed to create part" },
      { status: 500 }
    );
  }
}

// GET /api/inventory/parts - List all parts
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parts = await db.query.spareParts.findMany();

    return NextResponse.json(parts);
  } catch (error) {
    console.error("Error fetching parts:", error);
    return NextResponse.json(
      { error: "Failed to fetch parts" },
      { status: 500 }
    );
  }
}

import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/inventory/parts/[id] - Get single part
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return NextResponse.json({ error: "Invalid part ID" }, { status: 400 });
    }

    const part = await db.query.spareParts.findFirst({
      where: eq(spareParts.id, partId),
    });

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json(
      { error: "Failed to fetch part" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/parts/[id] - Update part
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return NextResponse.json({ error: "Invalid part ID" }, { status: 400 });
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

    const [part] = await db
      .update(spareParts)
      .set({
        name,
        sku,
        barcode,
        description,
        category,
        unitCost,
        reorderPoint,
        leadTimeDays,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, partId))
      .returning();

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json(
      { error: "Failed to update part" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/parts/[id] - Delete part
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const partId = Number.parseInt(id);

    if (Number.isNaN(partId)) {
      return NextResponse.json({ error: "Invalid part ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(spareParts)
      .where(eq(spareParts.id, partId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting part:", error);
    return NextResponse.json(
      { error: "Failed to delete part" },
      { status: 500 }
    );
  }
}

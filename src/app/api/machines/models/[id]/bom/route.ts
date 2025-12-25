import { db } from "@/db";
import { machineBoms } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/machines/models/[id]/bom - Add item to BOM
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: modelIdStr } = await params;
    const modelId = Number.parseInt(modelIdStr);

    const body = await request.json();
    const { partId, quantityRequired, notes } = body;

    if (!partId) {
      return NextResponse.json(
        { error: "Part ID is required" },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db.query.machineBoms.findFirst({
      where: and(
        eq(machineBoms.modelId, modelId),
        eq(machineBoms.partId, partId)
      ),
    });

    if (existing) {
      // Update
      const [updated] = await db
        .update(machineBoms)
        .set({
          quantityRequired: quantityRequired ?? existing.quantityRequired,
          notes: notes ?? existing.notes,
        })
        .where(eq(machineBoms.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    // Insert
    const [newItem] = await db
      .insert(machineBoms)
      .values({
        modelId,
        partId,
        quantityRequired: quantityRequired || 1,
        notes,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding BOM item:", error);
    return NextResponse.json(
      { error: "Failed to add BOM item" },
      { status: 500 }
    );
  }
}

import { db } from "@/db";
import { equipmentBoms } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (
      !user ||
      !userHasPermission(user, PERMISSIONS.EQUIPMENT_MANAGE_MODELS)
    ) {
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
    const existing = await db.query.equipmentBoms.findFirst({
      where: and(
        eq(equipmentBoms.modelId, modelId),
        eq(equipmentBoms.partId, partId)
      ),
    });

    if (existing) {
      // Update
      const [updated] = await db
        .update(equipmentBoms)
        .set({
          quantityRequired: quantityRequired ?? existing.quantityRequired,
          notes: notes ?? existing.notes,
        })
        .where(eq(equipmentBoms.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    // Insert
    const [newItem] = await db
      .insert(equipmentBoms)
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

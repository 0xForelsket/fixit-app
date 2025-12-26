import { db } from "@/db";
import { equipmentModels } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    const model = await db.query.equipmentModels.findFirst({
      where: eq(equipmentModels.id, Number.parseInt(id)),
      with: {
        bom: {
          with: {
            part: true,
          },
        },
        equipment: true,
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json(
      { error: "Failed to fetch model" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const { name, manufacturer, description, manualUrl } = body;

    const [updated] = await db
      .update(equipmentModels)
      .set({
        name,
        manufacturer,
        description,
        manualUrl,
        updatedAt: new Date(),
      })
      .where(eq(equipmentModels.id, Number.parseInt(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

    const { id } = await params;

    // Check if in use by equipment?
    // Just delete. Foreign keys might restrict if set up that way?
    // Drizzle relations don't modify DB constraints automatically unless defined in migration.
    // SQLite usually needs PRAGMA foreign_keys = ON.
    // I should check manually to be safe.

    const equipmentUsing = await db.query.equipment.findFirst({
      where: (equipment, { eq }) => eq(equipment.modelId, Number.parseInt(id)),
    });

    if (equipmentUsing) {
      return NextResponse.json(
        { error: "Cannot delete model: It is in use by one or more equipment" },
        { status: 400 }
      );
    }

    await db
      .delete(equipmentModels)
      .where(eq(equipmentModels.id, Number.parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    );
  }
}

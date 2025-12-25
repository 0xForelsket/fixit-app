import { db } from "@/db";
import { machineModels } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/machines/models/[id] - Get single model
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const model = await db.query.machineModels.findFirst({
      where: eq(machineModels.id, Number.parseInt(id)),
      with: {
        bom: {
          with: {
            part: true,
          },
        },
        machines: true,
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

// PATCH /api/machines/models/[id] - Update model
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
    const body = await request.json();
    const { name, manufacturer, description, manualUrl } = body;

    const [updated] = await db
      .update(machineModels)
      .set({
        name,
        manufacturer,
        description,
        manualUrl,
        updatedAt: new Date(),
      })
      .where(eq(machineModels.id, Number.parseInt(id)))
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

// DELETE /api/machines/models/[id] - Delete model
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if in use by machines?
    // Just delete. Foreign keys might restrict if set up that way?
    // Drizzle relations don't modify DB constraints automatically unless defined in migration.
    // SQLite usually needs PRAGMA foreign_keys = ON.
    // I should check manually to be safe.

    const machinesUsing = await db.query.machines.findFirst({
      where: (machines, { eq }) => eq(machines.modelId, Number.parseInt(id)),
    });

    if (machinesUsing) {
      return NextResponse.json(
        { error: "Cannot delete model: It is in use by one or more machines" },
        { status: 400 }
      );
    }

    await db
      .delete(machineModels)
      .where(eq(machineModels.id, Number.parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    );
  }
}

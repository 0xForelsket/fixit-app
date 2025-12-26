import { db } from "@/db";
import { equipmentModels } from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (
      !user ||
      !userHasPermission(user, PERMISSIONS.EQUIPMENT_MANAGE_MODELS)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, manufacturer, description, manualUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    const [model] = await db
      .insert(equipmentModels)
      .values({
        name,
        manufacturer,
        description,
        manualUrl,
      })
      .returning();

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment model:", error);
    return NextResponse.json(
      { error: "Failed to create equipment model" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const models = await db.query.equipmentModels.findMany({
      with: {
        equipment: true, // Include count or list of equipment using this model
        bom: {
          with: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching equipment models:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment models" },
      { status: 500 }
    );
  }
}

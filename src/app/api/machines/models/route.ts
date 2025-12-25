import { db } from "@/db";
import { machineModels } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

// POST /api/machines/models - Create new model
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
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
      .insert(machineModels)
      .values({
        name,
        manufacturer,
        description,
        manualUrl,
      })
      .returning();

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating machine model:", error);
    return NextResponse.json(
      { error: "Failed to create machine model" },
      { status: 500 }
    );
  }
}

// GET /api/machines/models - List all models
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const models = await db.query.machineModels.findMany({
      with: {
        machines: true, // Include count or list of machines using this model
        bom: {
          with: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching machine models:", error);
    return NextResponse.json(
      { error: "Failed to fetch machine models" },
      { status: 500 }
    );
  }
}

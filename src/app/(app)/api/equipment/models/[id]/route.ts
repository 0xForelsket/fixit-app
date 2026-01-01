import { db } from "@/db";
import { equipmentModels } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id } = await params;
    const model = await db.query.equipmentModels.findFirst({
      where: eq(equipmentModels.id, id),
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
      return ApiErrors.notFound("Model", requestId);
    }

    return apiSuccess(model);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching model");
    return ApiErrors.internal(error, requestId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (
      !user ||
      !userHasPermission(user, PERMISSIONS.EQUIPMENT_MANAGE_MODELS)
    ) {
      return ApiErrors.unauthorized(requestId);
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
      .where(eq(equipmentModels.id, id))
      .returning();

    return apiSuccess(updated);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error updating model");
    return ApiErrors.internal(error, requestId);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (
      !user ||
      !userHasPermission(user, PERMISSIONS.EQUIPMENT_MANAGE_MODELS)
    ) {
      return ApiErrors.unauthorized(requestId);
    }

    const { id } = await params;

    // Check if in use by equipment
    const equipmentUsing = await db.query.equipment.findFirst({
      where: (equipment, { eq }) => eq(equipment.modelId, id),
    });

    if (equipmentUsing) {
      return ApiErrors.conflict(
        "Cannot delete model: It is in use by one or more equipment",
        requestId
      );
    }

    await db
      .delete(equipmentModels)
      .where(eq(equipmentModels.id, id));

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error deleting model");
    return ApiErrors.internal(error, requestId);
  }
}

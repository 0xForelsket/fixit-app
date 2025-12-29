import { db } from "@/db";
import { equipmentModels } from "@/db/schema";
import { ApiErrors, apiSuccess, HttpStatus } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (
      !user ||
      !userHasPermission(user, PERMISSIONS.EQUIPMENT_MANAGE_MODELS)
    ) {
      return ApiErrors.unauthorized(requestId);
    }

    const body = await request.json();
    const { name, manufacturer, description, manualUrl } = body;

    if (!name) {
      return ApiErrors.validationError("Model name is required", requestId);
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

    return apiSuccess(model, HttpStatus.CREATED, requestId);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error creating equipment model");
    return ApiErrors.internal(error, requestId);
  }
}

export async function GET() {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return ApiErrors.unauthorized(requestId);
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

    return apiSuccess(models);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error fetching equipment models");
    return ApiErrors.internal(error, requestId);
  }
}

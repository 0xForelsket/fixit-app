import { db } from "@/db";
import { equipmentBoms } from "@/db/schema";
import { ApiErrors, HttpStatus, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";

export async function POST(
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

    const { id: modelIdStr } = await params;
    const modelId = Number.parseInt(modelIdStr);

    const body = await request.json();
    const { partId, quantityRequired, notes } = body;

    if (!partId) {
      return ApiErrors.validationError("Part ID is required", requestId);
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
      return apiSuccess(updated);
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

    return apiSuccess(newItem, HttpStatus.CREATED, requestId);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error adding BOM item");
    return ApiErrors.internal(error, requestId);
  }
}

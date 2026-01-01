import { db } from "@/db";
import { equipmentBoms } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; bomId: string }> }
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

    const { bomId } = await params;

    await db
      .delete(equipmentBoms)
      .where(eq(equipmentBoms.id, bomId));

    return apiSuccess({ success: true });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Error deleting BOM item");
    return ApiErrors.internal(error, requestId);
  }
}

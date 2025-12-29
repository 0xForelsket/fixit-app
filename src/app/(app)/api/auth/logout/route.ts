import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { authLogger, generateRequestId } from "@/lib/logger";
import { deleteSession } from "@/lib/session";

export async function POST() {
  const requestId = generateRequestId();

  try {
    await deleteSession();
    authLogger.info({ requestId }, "User logged out");
    return apiSuccess({ success: true });
  } catch (error) {
    authLogger.error({ requestId, error }, "Logout error");
    return ApiErrors.internal(error, requestId);
  }
}

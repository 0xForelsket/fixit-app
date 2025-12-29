import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { authLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return ApiErrors.unauthorized(requestId);
    }

    return apiSuccess({ user });
  } catch (error) {
    authLogger.error({ requestId, error }, "Auth check error");
    return ApiErrors.internal(error, requestId);
  }
}

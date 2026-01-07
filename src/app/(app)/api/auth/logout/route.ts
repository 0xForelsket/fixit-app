import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { authLogger, generateRequestId } from "@/lib/logger";
import { deleteSession, requireCsrf } from "@/lib/session";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // CSRF protection to prevent cross-site logout attacks
    await requireCsrf(request);

    await deleteSession();
    authLogger.info({ requestId }, "User logged out");
    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "CSRF token missing" ||
        error.message === "CSRF token invalid"
      ) {
        return ApiErrors.forbidden(requestId);
      }
    }
    authLogger.error({ requestId, error }, "Logout error");
    return ApiErrors.internal(error, requestId);
  }
}

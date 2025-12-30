import { ApiErrors } from "@/lib/api-error";
import { authLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authenticateUser } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `login:${clientIp}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowMs
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return ApiErrors.rateLimited(retryAfter, requestId);
    }

    const body = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return ApiErrors.validationError("Invalid credentials format", requestId);
    }

    const { employeeId, pin } = result.data;

    const authResult = await authenticateUser(employeeId, pin);

    if (!authResult.success) {
      authLogger.warn({ requestId, employeeId }, "Login failed");
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    authLogger.info(
      { requestId, userId: authResult.user.id },
      "Login successful"
    );

    return NextResponse.json({
      success: true,
      csrfToken: authResult.csrfToken,
      user: {
        id: authResult.user.id,
        employeeId: authResult.user.employeeId,
        name: authResult.user.name,
        roleName: authResult.user.roleName,
        permissions: authResult.user.permissions,
      },
    });
  } catch (error) {
    authLogger.error({ requestId, error }, "Login error");
    return ApiErrors.internal(error, requestId);
  }
}

import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authenticateUser } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(
      `login:${clientIp}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowMs
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.reset - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { employeeId, pin } = result.data;

    const authResult = await authenticateUser(employeeId, pin);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

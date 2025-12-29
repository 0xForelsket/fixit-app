import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/auth.service", () => ({
  authenticateUser: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

import { POST } from "@/app/(app)/api/auth/login/route";
import { checkRateLimit } from "@/lib/rate-limit";
import { authenticateUser } from "@/lib/services/auth.service";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "1234" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "", pin: "12" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid credentials format");
  });

  it("returns 401 for invalid credentials", async () => {
    vi.mocked(authenticateUser).mockResolvedValue({
      success: false,
      error: "Invalid employee ID or PIN",
      status: 401,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid employee ID or PIN");
  });

  it("returns 403 for locked account", async () => {
    vi.mocked(authenticateUser).mockResolvedValue({
      success: false,
      error: "Account is locked. Try again in 10 minute(s).",
      status: 403,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/Account is locked/);
  });

  it("returns success with user and csrf token", async () => {
    vi.mocked(authenticateUser).mockResolvedValue({
      success: true,
      user: {
        id: 1,
        employeeId: "TECH-001",
        name: "Test User",
        roleName: "tech",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      },
      csrfToken: "csrf-token-123",
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TECH-001", pin: "1234" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.csrfToken).toBe("csrf-token-123");
    expect(data.user.employeeId).toBe("TECH-001");
  });
});

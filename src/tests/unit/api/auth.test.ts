import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it,vi } from "vitest";

const mockAuthenticateUser = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn(() => "127.0.0.1");

vi.mock("@/lib/services/auth.service", () => ({
  authenticateUser: mockAuthenticateUser,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    login: { limit: 5, windowMs: 60000 },
    api: { limit: 100, windowMs: 60000 },
    upload: { limit: 10, windowMs: 60000 },
  },
}));

const { POST } = await import("@/app/(app)/api/auth/login/route");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockAuthenticateUser.mockClear();
    mockCheckRateLimit.mockClear();
    mockGetClientIp.mockClear();
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "123456" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "", pin: "12345" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid credentials format");
  });

  it("returns 401 for invalid credentials", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Invalid employee ID or PIN",
      status: 401,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "123456" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid employee ID or PIN");
  });

  it("returns 403 for locked account", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Account is locked. Try again in 10 minute(s).",
      status: 403,
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TEST-001", pin: "123456" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toMatch(/Account is locked/);
  });

  it("returns success with user and csrf token", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: true,
      user: {
        id: "1", displayId: 1,
        employeeId: "TECH-001",
        name: "Test User",
        roleName: "tech",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      },
      csrfToken: "csrf-token-123",
    });

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: "TECH-001", pin: "123456" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.csrfToken).toBe("csrf-token-123");
    expect(data.user.employeeId).toBe("TECH-001");
  });
});

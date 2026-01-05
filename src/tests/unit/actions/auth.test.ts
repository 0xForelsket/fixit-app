import { login } from "@/actions/auth";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it,vi } from "vitest";

const { mockAuthenticateUser, mockDeleteSession, mockRedirect } = vi.hoisted(() => ({
  mockAuthenticateUser: vi.fn(),
  mockDeleteSession: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@/lib/services/auth.service", () => ({
  authenticateUser: mockAuthenticateUser,
}));

vi.mock("@/lib/session", () => ({
  deleteSession: mockDeleteSession,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// We must import after mocking
import { authenticateUser } from "@/lib/services/auth.service";
import { redirect } from "next/navigation";

describe("login action", () => {
  beforeEach(() => {
    mockAuthenticateUser.mockClear();
    mockDeleteSession.mockClear();
    mockRedirect.mockClear();
  });

  it("should return error for invalid input format", async () => {
    const formData = new FormData();
    formData.set("employeeId", "");
    formData.set("pin", "12");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN format");
  });

  it("should return error when authentication fails", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Invalid employee ID or PIN",
    });

    const formData = new FormData();
    formData.set("employeeId", "UNKNOWN-001");
    formData.set("pin", "123456");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN");
  });

  it("should return error for inactive user", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Account is disabled. Please contact an administrator.",
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "123456");

    const result = await login({}, formData);

    expect(result.error).toBe(
      "Account is disabled. Please contact an administrator."
    );
  });

  it("should return error for locked account", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Account is locked. Try again in 10 minute(s).",
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "123456");

    const result = await login({}, formData);

    expect(result.error).toMatch(/Account is locked/);
  });

  it("should return error for wrong PIN", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Invalid employee ID or PIN",
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "654321");

    const result = await login({}, formData);

    expect(result.error).toBe("Invalid employee ID or PIN");
  });

  it("should return lockout error after too many failed attempts", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: "Too many failed attempts. Account locked for 15 minutes.",
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "654321");

    const result = await login({}, formData);

    expect(result.error).toBe(
      "Too many failed attempts. Account locked for 15 minutes."
    );
  });

  it("should redirect tech to /dashboard on successful login", async () => {
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
      csrfToken: "csrf-token",
    });

    const formData = new FormData();
    formData.set("employeeId", "TECH-001");
    formData.set("pin", "123456");

    try {
      await login({}, formData);
    } catch {}

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should redirect admin to /dashboard on successful login", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: true,
      user: {
        id: "1", displayId: 1,
        employeeId: "ADMIN-001",
        name: "Admin User",
        roleName: "admin",
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        sessionVersion: 1,
      },
      csrfToken: "csrf-token",
    });

    const formData = new FormData();
    formData.set("employeeId", "ADMIN-001");
    formData.set("pin", "123456");

    try {
      await login({}, formData);
    } catch {}

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should redirect operator to / on successful login", async () => {
    mockAuthenticateUser.mockResolvedValue({
      success: true,
      user: {
        id: "1", displayId: 1,
        employeeId: "OP-001",
        name: "Operator User",
        roleName: "operator",
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      },
      csrfToken: "csrf-token",
    });

    const formData = new FormData();
    formData.set("employeeId", "OP-001");
    formData.set("pin", "123456");

    try {
      await login({}, formData);
    } catch {}

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});

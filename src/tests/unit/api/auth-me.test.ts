import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockGetCurrentUser = vi.fn();
const mockDeleteSession = vi.fn();

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  deleteSession: mockDeleteSession,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  authLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

const { POST } = await import("@/app/(app)/api/auth/logout/route");
const { GET } = await import("@/app/(app)/api/auth/me/route");

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockDeleteSession.mockClear();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns user when authenticated", async () => {
    const mockUser = {
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech User",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    };
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user).toEqual(mockUser);
  });

  it("returns admin user with full permissions", async () => {
    const mockAdmin = {
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin User",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    };
    mockGetCurrentUser.mockResolvedValue(mockAdmin);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user.roleName).toBe("admin");
    expect(data.data.user.permissions).toContain("*");
  });

  it("handles errors gracefully", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Session error"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockDeleteSession.mockClear();
  });

  it("logs out successfully", async () => {
    mockDeleteSession.mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(mockDeleteSession).toHaveBeenCalled();
  });

  it("handles logout errors", async () => {
    mockDeleteSession.mockRejectedValue(new Error("Logout failed"));

    const response = await POST();

    expect(response.status).toBe(500);
  });
});

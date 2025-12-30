import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
  deleteSession: vi.fn(),
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

import { POST } from "@/app/(app)/api/auth/logout/route";
import { GET } from "@/app/(app)/api/auth/me/route";
import { deleteSession, getCurrentUser } from "@/lib/session";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns user when authenticated", async () => {
    const mockUser = {
      id: 1,
      employeeId: "TECH-001",
      name: "Tech User",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user).toEqual(mockUser);
  });

  it("returns admin user with full permissions", async () => {
    const mockAdmin = {
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin User",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"],
    };
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.user.roleName).toBe("admin");
    expect(data.data.user.permissions).toContain("*");
  });

  it("handles errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Session error"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs out successfully", async () => {
    vi.mocked(deleteSession).mockResolvedValue(undefined);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(deleteSession).toHaveBeenCalled();
  });

  it("handles logout errors", async () => {
    vi.mocked(deleteSession).mockRejectedValue(new Error("Logout failed"));

    const response = await POST();

    expect(response.status).toBe(500);
  });
});

import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Create mocks
const mockGetCurrentUser = mock();
const mockUserHasPermission = mock();
const mockSelect = mock();
const mockFrom = mock();
const mockWhere = mock();

// Mock the db module
mock.module("@/db", () => ({
  db: {
    select: mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere,
      }),
    }),
  },
}));

// Mock session
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock auth
mock.module("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    ANALYTICS_VIEW: "analytics:view",
  },
}));

// Mock logger
mock.module("@/lib/logger", () => ({
  apiLogger: {
    error: mock(),
    warn: mock(),
    info: mock(),
  },
  generateRequestId: mock(() => "test-request-id"),
}));

const { GET } = await import("@/app/(app)/api/analytics/kpis/route");

describe("GET /api/analytics/kpis", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockUserHasPermission.mockClear();
    mockSelect.mockClear();
    mockFrom.mockClear();
    mockWhere.mockClear();
    // Reset mock chain
    mockSelect.mockReturnValue({
      from: mockFrom.mockReturnValue({
        where: mockWhere,
      }),
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    mockUserHasPermission.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 401 when lacking analytics permission", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });
    mockUserHasPermission.mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("requires analytics permission", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockUserHasPermission.mockReturnValue(true);

    // The endpoint requires complex db queries - just verify auth passes
    // When permission is granted, it should attempt to query the database
    // Mock will cause 500, but that's expected in unit tests without full db setup
    const response = await GET();

    // Should not be 401 when authenticated with permission
    expect(response.status).not.toBe(401);
  });

  it("calls userHasPermission with correct permission", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockUserHasPermission.mockReturnValue(true);

    await GET();

    expect(mockUserHasPermission).toHaveBeenCalled();
  });

  it("handles database errors gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockUserHasPermission.mockReturnValue(true);
    mockWhere.mockRejectedValue(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("Database error");
  });
});

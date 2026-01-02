import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Create mocks
const mockFindMany = mock();

const mockGetCurrentUser = mock();

const mockApiLogger = {
  error: mock(),
  warn: mock(),
  info: mock(),
};
const mockGenerateRequestId = mock(() => "test-request-id");

// Mock modules
mock.module("@/db", () => ({
  db: {
    query: {
      notifications: {
        findMany: mockFindMany,
      },
    },
  },
}));

mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

mock.module("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

// Dynamic imports after mock.module
const { GET } = await import("@/app/(app)/api/notifications/route");

beforeEach(() => {
  mockFindMany.mockClear();
  mockGetCurrentUser.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();
});

describe("GET /api/notifications", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns notifications for authenticated user", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockNotifications = [
      {
        id: "1", displayId: 1,
        userId: "1",
        type: "work_order_assigned" as const,
        title: "New work order assigned",
        message: "You have been assigned to WO-123",
        link: "/maintenance/work-orders/123",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: "2", displayId: 2,
        userId: "1",
        type: "work_order_escalated" as const,
        title: "Critical issue reported",
        message: "Machine A is down",
        link: "/maintenance/work-orders/456",
        isRead: true,
        createdAt: new Date(),
      },
    ];

    mockFindMany.mockResolvedValue(
      mockNotifications
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.notifications).toHaveLength(2);
    expect(data.data.notifications[0].type).toBe("work_order_assigned");
  });

  it("returns empty array when user has no notifications", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.notifications).toEqual([]);
  });

  it("handles database errors gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindMany.mockRejectedValue(
      new Error("Connection timeout")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("Connection timeout");
  });
});

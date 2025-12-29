import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      notifications: {
        findMany: vi.fn(),
      },
    },
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

import { GET } from "@/app/api/notifications/route";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns notifications for authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const mockNotifications = [
      {
        id: 1,
        userId: 1,
        type: "work_order_assigned",
        title: "New work order assigned",
        message: "You have been assigned to WO-123",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        type: "critical_issue",
        title: "Critical issue reported",
        message: "Machine A is down",
        isRead: true,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.query.notifications.findMany).mockResolvedValue(mockNotifications);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.notifications).toHaveLength(2);
    expect(data.data.notifications[0].type).toBe("work_order_assigned");
  });

  it("returns empty array when user has no notifications", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.notifications.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.notifications).toEqual([]);
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.notifications.findMany).mockRejectedValue(
      new Error("Connection timeout")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("Connection timeout");
  });
});

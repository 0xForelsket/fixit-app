import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      notifications: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
  requireCsrf: vi.fn().mockResolvedValue(true),
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

import { PATCH } from "@/app/(app)/api/notifications/[id]/route";
import { POST as POST_READ_ALL } from "@/app/(app)/api/notifications/read-all/route";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("PATCH /api/notifications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/notifications/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid notification ID", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request("http://localhost/api/notifications/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 when notification not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.query.notifications.findFirst).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/notifications/999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when notification belongs to different user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 2, // Different user
      employeeId: "TECH-002",
      name: "Other Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.query.notifications.findFirst).mockResolvedValue({
      id: 1,
      userId: 1, // Belongs to user 1
      type: "work_order_created" as const,
      title: "New Work Order",
      message: "A new work order has been created",
      link: "/maintenance/work-orders/1",
      isRead: false,
      createdAt: new Date(),
    });

    const request = new Request("http://localhost/api/notifications/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
  });

  it("updates notification successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.query.notifications.findFirst).mockResolvedValue({
      id: 1,
      userId: 1, // Same user
      type: "work_order_created" as const,
      title: "New Work Order",
      message: "A new work order has been created",
      link: "/maintenance/work-orders/1",
      isRead: false,
      createdAt: new Date(),
    });

    const request = new Request("http://localhost/api/notifications/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("can mark notification as unread", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.query.notifications.findFirst).mockResolvedValue({
      id: 1,
      userId: 1,
      type: "work_order_created" as const,
      title: "New Work Order",
      message: "A new work order has been created",
      link: "/maintenance/work-orders/1",
      isRead: true,
      createdAt: new Date(),
    });

    const request = new Request("http://localhost/api/notifications/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: false }),
    }) as unknown as import("next/server").NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});

describe("POST /api/notifications/read-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await POST_READ_ALL();

    expect(response.status).toBe(401);
  });

  it("marks all notifications as read", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const response = await POST_READ_ALL();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.update).mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await POST_READ_ALL();

    expect(response.status).toBe(500);
  });
});

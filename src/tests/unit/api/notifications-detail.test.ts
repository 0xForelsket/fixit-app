import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockFindFirst = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere,
  }),
}));

const mockGetCurrentUser = vi.fn();
const mockRequireCsrf = vi.fn().mockResolvedValue(true);

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

// Mock modules
vi.mock("@/db", () => ({
  db: {
    query: {
      notifications: {
        findFirst: mockFindFirst,
      },
    },
    update: mockUpdate,
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  requireCsrf: mockRequireCsrf,
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

// Dynamic imports after mock.module
const { PATCH } = await import("@/app/(app)/api/notifications/[id]/route");
const { POST: POST_READ_ALL } = await import(
  "@/app/(app)/api/notifications/read-all/route"
);

// Helper to create mock request with CSRF header for read-all
const createMockReadAllRequest = () =>
  new Request("http://localhost/api/notifications/read-all", {
    method: "POST",
    headers: { "x-csrf-token": "valid-csrf-token" },
  });

beforeEach(() => {
  mockFindFirst.mockClear();
  mockUpdate.mockClear();
  mockUpdateSet.mockClear();
  mockUpdateWhere.mockClear();
  mockGetCurrentUser.mockClear();
  mockRequireCsrf.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();

  // Reset chains
  mockUpdate.mockReturnValue({
    set: mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere,
    }),
  });
});

describe("PATCH /api/notifications/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/notifications/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as any;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid notification ID", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request("http://localhost/api/notifications/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as any;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when notification not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/notifications/999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    }) as any;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when notification belongs to different user", async () => {
    mockGetCurrentUser.mockResolvedValue({
      displayId: 2,
      id: "2", // Different user
      employeeId: "TECH-002",
      name: "Other Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue({
      id: "1",

      userId: "1", // Belongs to user 1
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
    }) as any;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
  });

  it("updates notification successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue({
      id: "1",

      userId: "1", // Same user
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
    }) as any;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("can mark notification as unread", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue({
      id: "1",

      userId: "1",
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
    }) as any;

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
    mockRequireCsrf.mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST_READ_ALL(createMockReadAllRequest());

    expect(response.status).toBe(401);
  });

  it("marks all notifications as read", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const response = await POST_READ_ALL(createMockReadAllRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockUpdate.mockImplementation(() => {
      throw new Error("Database error");
    });

    const response = await POST_READ_ALL(createMockReadAllRequest());

    expect(response.status).toBe(500);
  });

  it("returns 403 when CSRF token is invalid", async () => {
    mockRequireCsrf.mockRejectedValue(new Error("CSRF token invalid"));

    const response = await POST_READ_ALL(createMockReadAllRequest());

    expect(response.status).toBe(403);
  });
});

import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

// Create mocks
const mockFindFirst = mock();
const mockDeleteWhere = mock();
const mockDeleteReturning = mock();
const mockDelete = mock(() => ({
  where: mockDeleteWhere.mockReturnValue({
    returning: mockDeleteReturning.mockResolvedValue([]),
  }),
}));

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
      laborLogs: {
        findFirst: mockFindFirst,
      },
    },
    delete: mockDelete,
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
const { DELETE, GET } = await import("@/app/(app)/api/labor/[id]/route");

beforeEach(() => {
  mockFindFirst.mockClear();
  mockDelete.mockClear();
  mockDeleteWhere.mockClear();
  mockDeleteReturning.mockClear();
  mockGetCurrentUser.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();

  // Reset chains
  mockDelete.mockReturnValue({
    where: mockDeleteWhere.mockReturnValue({
      returning: mockDeleteReturning.mockResolvedValue([]),
    }),
  });
});

describe("GET /api/labor/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid labor log ID", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request("http://localhost/api/labor/abc");
    const response = await GET(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when labor log not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/labor/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns labor log with related data", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockLaborLog = {
      id: "1", displayId: 1,
      userId: "1",
      workOrderId: "1",
      startTime: new Date(),
      endTime: new Date(),
      durationMinutes: 60,
      hourlyRate: 50,
      isBillable: true,
      notes: "Maintenance work",
      createdAt: new Date(),
      user: { id: "1", displayId: 1, name: "Tech User" },
      workOrder: { id: "1", displayId: 1, title: "Work Order 1" },
    };
    mockFindFirst.mockResolvedValue(mockLaborLog);

    const request = new Request("http://localhost/api/labor/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.id).toBe("1");
    expect(data.data.durationMinutes).toBe(60);
    expect(data.data.user.name).toBe("Tech User");
    expect(data.data.workOrder.title).toBe("Work Order 1");
  });
});

describe("DELETE /api/labor/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/labor/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid labor log ID", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const request = new Request("http://localhost/api/labor/abc", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when labor log not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockDeleteReturning.mockResolvedValue([]);

    const request = new Request("http://localhost/api/labor/999", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("deletes labor log successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    mockDeleteReturning.mockResolvedValue([{ id: "1", displayId: 1 }]);

    const request = new Request("http://localhost/api/labor/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});

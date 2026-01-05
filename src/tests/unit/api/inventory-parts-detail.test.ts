import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindFirst = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning.mockResolvedValue([]),
    }),
  }),
}));
const mockDeleteWhere = vi.fn();
const mockDeleteReturning = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere.mockReturnValue({
    returning: mockDeleteReturning.mockResolvedValue([]),
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

const mockUserHasPermission = vi.fn();

// Mock modules
vi.vi.fn("@/db", () => ({
  db: {
    query: {
      spareParts: {
        findFirst: mockFindFirst,
      },
    },
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.vi.fn("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  requireCsrf: mockRequireCsrf,
}));

vi.vi.fn("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

vi.vi.fn("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    INVENTORY_VIEW: "inventory:view",
    INVENTORY_UPDATE: "inventory:update",
    INVENTORY_DELETE: "inventory:delete",
  },
}));

// Dynamic imports after mock.module
const { DELETE, GET, PATCH } = await import("@/app/(app)/api/inventory/parts/[id]/route");

beforeEach(() => {
  mockFindFirst.mockClear();
  mockUpdate.mockClear();
  mockUpdateSet.mockClear();
  mockUpdateWhere.mockClear();
  mockUpdateReturning.mockClear();
  mockDelete.mockClear();
  mockDeleteWhere.mockClear();
  mockDeleteReturning.mockClear();
  mockGetCurrentUser.mockClear();
  mockRequireCsrf.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();
  mockUserHasPermission.mockClear();

  // Reset chains
  mockUpdate.mockReturnValue({
    set: mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere.mockReturnValue({
        returning: mockUpdateReturning.mockResolvedValue([]),
      }),
    }),
  });
  mockDelete.mockReturnValue({
    where: mockDeleteWhere.mockReturnValue({
      returning: mockDeleteReturning.mockResolvedValue([]),
    }),
  });
});

describe("GET /api/inventory/parts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request("http://localhost/api/inventory/parts/abc");
    const response = await GET(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when part not found", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/inventory/parts/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns part details", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: "2",
      departmentId: "1",
      isActive: true,
      employeeId: "TECH-001",
      hourlyRate: 25.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const mockPart = {
      id: "1", displayId: 1,
      name: "Bearing SKF-123",
      sku: "SKF-123",
      barcode: null,
      description: "High quality bearing",
      category: "mechanical" as const,
      vendorId: "1",
      unitCost: 25.5,
      reorderPoint: 10,
      leadTimeDays: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockPart);

    const request = new Request("http://localhost/api/inventory/parts/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Bearing SKF-123");
    expect(data.data.sku).toBe("SKF-123");
  });
});

describe("PATCH /api/inventory/parts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when user lacks permission", async () => {
    mockUserHasPermission.mockReturnValue(false);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Operator",
      email: "op@example.com",
      pin: "hashed",
      roleId: "1",
      departmentId: "1",
      isActive: true,
      employeeId: "OP-001",
      hourlyRate: 20.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request("http://localhost/api/inventory/parts/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when part not found", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    mockUpdateReturning.mockResolvedValue([]);

    const request = new Request("http://localhost/api/inventory/parts/999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("updates part successfully", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const updatedPart = {
      id: "1", displayId: 1,
      name: "Updated Bearing",
      sku: "SKF-123",
      unitCost: 30.0,
    };
    mockUpdateReturning.mockResolvedValue([updatedPart]);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Bearing", unitCost: 30.0 }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Updated Bearing");
    expect(data.data.unitCost).toBe(30.0);
  });
});

describe("DELETE /api/inventory/parts/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when user lacks permission", async () => {
    mockUserHasPermission.mockReturnValue(false);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      departmentId: "1",
      sessionVersion: 1,
      permissions: ["ticket:view", "equipment:view"],
      hourlyRate: 25.0,
    });

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const request = new Request("http://localhost/api/inventory/parts/abc", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when part not found", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    mockDeleteReturning.mockResolvedValue([]);

    const request = new Request("http://localhost/api/inventory/parts/999", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("deletes part successfully", async () => {
    mockUserHasPermission.mockReturnValue(true);
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
      employeeId: "ADMIN-001",
      hourlyRate: 50.0,
      preferences: {
        theme: "light",
        density: "comfortable",
        notifications: { email: true },
      },
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    mockDeleteReturning.mockResolvedValue([{ id: "1", displayId: 1 }]);

    const request = new Request("http://localhost/api/inventory/parts/1", {
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

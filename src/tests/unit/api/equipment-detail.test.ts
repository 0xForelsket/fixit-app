import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mocks
const mockFindFirst = vi.fn();
const mockInsert = vi.fn(() => ({
  values: vi.fn(),
}));
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning,
    }),
  }),
}));
const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere,
}));

const mockRequireAuth = vi.fn();
const mockRequireCsrf = vi.fn();
const mockRequirePermission = vi.fn();

const mockCheckRateLimit = vi.fn(() => ({
  success: true,
  remaining: 99,
  reset: Date.now() + 60000,
}));
const mockGetClientIp = vi.fn(() => "127.0.0.1");

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

const mockRevalidatePath = vi.fn();

// Mock modules
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: {
        findFirst: mockFindFirst,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mockRequireAuth,
  requireCsrf: mockRequireCsrf,
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    api: { limit: 100, windowMs: 60000 },
  },
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Dynamic imports after mock.module
const { DELETE, GET, PATCH } = await import(
  "@/app/(app)/api/equipment/[id]/route"
);

describe("GET /api/equipment/[id]", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockRequireAuth.mockClear();
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockCheckRateLimit.mockClear();
    mockGetClientIp.mockClear();
    mockApiLogger.error.mockClear();
    mockApiLogger.warn.mockClear();
    mockApiLogger.info.mockClear();
    mockGenerateRequestId.mockClear();
    mockRevalidatePath.mockClear();
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    mockRequireAuth.mockResolvedValue({
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

    const request = new Request("http://localhost/api/equipment/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns equipment when found", async () => {
    mockRequireAuth.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockEquipment = {
      id: "1",
      displayId: 1,
      name: "Machine A",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      location: { id: "1", displayId: 1, name: "Floor 1" },
      ownerId: null,
      owner: null,
      parentId: null,
      parent: null,
      departmentId: "1",
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    };
    mockFindFirst.mockResolvedValue(mockEquipment);

    const request = new Request("http://localhost/api/equipment/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Machine A");
    expect(data.data.code).toBe("MA-001");
  });
});

describe("PATCH /api/equipment/[id]", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockRequireAuth.mockClear();
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockCheckRateLimit.mockClear();
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
    mockUpdateReturning.mockClear();

    // Reset mock chains
    mockUpdate.mockReturnValue({
      set: mockUpdateSet.mockReturnValue({
        where: mockUpdateWhere.mockReturnValue({
          returning: mockUpdateReturning,
        }),
      }),
    });
  });

  // Rate limiting is currently disabled in the route (import commented out)
  it.skip("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const request = new Request("http://localhost/api/equipment/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(429);
  });

  it("returns 403 when CSRF fails", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    // The route catches CSRF errors and maps them to 403
    mockRequireCsrf.mockRejectedValue(new Error("CSRF token missing"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/equipment/999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("updates equipment successfully", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });

    const existingEquipment = {
      id: "1",
      displayId: 1,
      name: "Old Name",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      departmentId: "1",
      ownerId: null,
      parentId: null,
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEquipment);

    const updatedEquipment = {
      id: "1",
      displayId: 1,
      name: "New Name",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      departmentId: "1",
      ownerId: null,
      parentId: null,
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUpdateReturning.mockResolvedValue([updatedEquipment]);

    const request = new Request("http://localhost/api/equipment/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("New Name");
  });

  it("returns 400 for invalid input", async () => {
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });

    const request = new Request("http://localhost/api/equipment/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/equipment/[id]", () => {
  beforeEach(() => {
    mockRequireCsrf.mockClear();
    mockRequirePermission.mockClear();
    mockFindFirst.mockClear();
    mockDelete.mockClear();
    mockDeleteWhere.mockClear();

    mockDelete.mockReturnValue({
      where: mockDeleteWhere,
    });
  });

  it("returns 403 when CSRF fails", async () => {
    mockRequireCsrf.mockRejectedValue(new Error("Forbidden"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/equipment/999", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when equipment has work orders", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockFindFirst.mockResolvedValue({
      id: "1",
      displayId: 1,
      name: "Machine",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      departmentId: "1",
      ownerId: null,
      parentId: null,
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [{ id: "1", displayId: 1 }],
      children: [],
    } as any);

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("work orders");
  });

  it("returns 400 when equipment has children", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockFindFirst.mockResolvedValue({
      id: "1",
      displayId: 1,
      name: "Machine",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      departmentId: "1",
      ownerId: null,
      parentId: null,
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [],
      children: [{ id: "2", displayId: 2 }],
    } as any);

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("sub-assets");
  });

  it("deletes equipment successfully", async () => {
    mockRequireCsrf.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    mockFindFirst.mockResolvedValue({
      id: "1",
      displayId: 1,
      name: "Machine",
      code: "MA-001",
      status: "operational" as const,
      locationId: "1",
      departmentId: "1",
      ownerId: null,
      parentId: null,
      modelId: null,
      typeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [],
      children: [],
    } as any);

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.deleted).toBe(true);
  });
});

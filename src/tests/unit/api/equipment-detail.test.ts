import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  requireCsrf: vi.fn(),
  requirePermission: vi.fn(),
}));

// Mock rate limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    reset: Date.now() + 60000,
  })),
  getClientIp: vi.fn(() => "127.0.0.1"),
  RATE_LIMITS: {
    api: { limit: 100, windowMs: 60000 },
  },
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

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PATCH } from "@/app/(app)/api/equipment/[id]/route";
import { db } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth, requireCsrf, requirePermission } from "@/lib/session";

describe("GET /api/equipment/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/equipment/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns equipment when found", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const mockEquipment = {
      id: "1", displayId: 1,
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
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(mockEquipment);

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
    vi.clearAllMocks();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
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
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockRejectedValue(new Error("Forbidden"));

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
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockRejectedValue(new Error("Unauthorized"));

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
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(undefined);

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
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });

    const existingEquipment = {
      id: "1", displayId: 1,
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
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(
      existingEquipment
    );

    const updatedEquipment = {
      id: "1", displayId: 1,
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
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedEquipment]),
        })),
      })),
    } as unknown as ReturnType<typeof db.update>);

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
    vi.mocked(checkRateLimit).mockReturnValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
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
    vi.clearAllMocks();
  });

  it("returns 403 when CSRF fails", async () => {
    vi.mocked(requireCsrf).mockRejectedValue(new Error("Forbidden"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockRejectedValue(new Error("Unauthorized"));

    const request = new Request("http://localhost/api/equipment/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1", displayId: 1 }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when equipment not found", async () => {
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/equipment/999", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999", displayId: 999 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when equipment has work orders", async () => {
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: "1", displayId: 1,
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
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: "1", displayId: 1,
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
    vi.mocked(requireCsrf).mockResolvedValue(undefined);
    vi.mocked(requirePermission).mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: "1", displayId: 1,
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
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(),
    } as unknown as ReturnType<typeof db.delete>);

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

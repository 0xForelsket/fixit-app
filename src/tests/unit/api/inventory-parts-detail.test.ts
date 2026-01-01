import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      spareParts: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
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

import { DELETE, GET, PATCH } from "@/app/(app)/api/inventory/parts/[id]/route";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/inventory/parts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
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

    expect(response.status).toBe(400);
  });

  it("returns 404 when part not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
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
    vi.mocked(db.query.spareParts.findFirst).mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/inventory/parts/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns part details", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Tech",
      email: "tech@example.com",
      pin: "hashed",
      roleId: 2,
      departmentId: 1,
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
      id: 1,
      name: "Bearing SKF-123",
      sku: "SKF-123",
      barcode: null,
      description: "High quality bearing",
      category: "mechanical" as const,
      vendorId: 1,
      unitCost: 25.5,
      reorderPoint: 10,
      leadTimeDays: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(db.query.spareParts.findFirst).mockResolvedValue(mockPart);

    const request = new Request("http://localhost/api/inventory/parts/1");
    const response = await GET(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Bearing SKF-123");
    expect(data.data.sku).toBe("SKF-123");
  });
});

describe("PATCH /api/inventory/parts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when user lacks permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Operator",
      email: "op@example.com",
      pin: "hashed",
      roleId: 1,
      departmentId: 1,
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
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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

    expect(response.status).toBe(400);
  });

  it("returns 404 when part not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as unknown as ReturnType<typeof db.update>);

    const request = new Request("http://localhost/api/inventory/parts/999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("updates part successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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
      id: 1,
      name: "Updated Bearing",
      sku: "SKF-123",
      unitCost: 30.0,
    };
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([updatedPart]),
        })),
      })),
    } as unknown as ReturnType<typeof db.update>);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Bearing", unitCost: 30.0 }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe("Updated Bearing");
    expect(data.data.unitCost).toBe(30.0);
  });
});

describe("DELETE /api/inventory/parts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 401 when user lacks permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      departmentId: 1,
      sessionVersion: 1, permissions: ["ticket:view", "equipment:view"],
      hourlyRate: 25.0,
    });

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid part ID", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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

    expect(response.status).toBe(400);
  });

  it("returns 404 when part not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.delete>);

    const request = new Request("http://localhost/api/inventory/parts/999", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("deletes part successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@example.com",
      pin: "hashed",
      roleId: 3,
      departmentId: 1,
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
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      })),
    } as unknown as ReturnType<typeof db.delete>);

    const request = new Request("http://localhost/api/inventory/parts/1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(true);
  });
});

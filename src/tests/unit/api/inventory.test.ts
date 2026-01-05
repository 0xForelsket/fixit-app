import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindMany = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
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
        findMany: mockFindMany,
      },
    },
    insert: mockInsert,
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
    INVENTORY_CREATE: "inventory:create",
    INVENTORY_VIEW: "inventory:view",
  },
}));

// Dynamic imports after mock.module
const { GET, POST } = await import("@/app/(app)/api/inventory/parts/route");

beforeEach(() => {
  mockFindMany.mockClear();
  mockInsert.mockClear();
  mockInsertValues.mockClear();
  mockInsertReturning.mockClear();
  mockGetCurrentUser.mockClear();
  mockRequireCsrf.mockClear();
  mockApiLogger.error.mockClear();
  mockApiLogger.warn.mockClear();
  mockApiLogger.info.mockClear();
  mockGenerateRequestId.mockClear();
  mockUserHasPermission.mockClear();

  // Reset chains
  mockInsert.mockReturnValue({
    values: mockInsertValues.mockReturnValue({
      returning: mockInsertReturning,
    }),
  });
});

describe("GET /api/inventory/parts", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns parts list when authenticated", async () => {
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

    const mockParts = [
      {
        id: "1", displayId: 1,
        name: "Bearing",
        sku: "BRG-001",
        barcode: null,
        description: "Standard ball bearing",
        category: "mechanical" as const,
        vendorId: "1",
        unitCost: 25.99,
        reorderPoint: 10,
        leadTimeDays: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2", displayId: 2,
        name: "Motor",
        sku: "MTR-001",
        barcode: null,
        description: "Replacement motor",
        category: "electrical" as const,
        vendorId: "2",
        unitCost: 150.0,
        reorderPoint: 5,
        leadTimeDays: 14,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockFindMany.mockResolvedValue(mockParts);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe("Bearing");
  });

  it("handles database errors gracefully", async () => {
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

    mockFindMany.mockRejectedValue(
      new Error("Database connection lost")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("unexpected error");
    // Should NOT leak the database error message
    expect(data.error).not.toContain("Database connection");
  });
});

describe("POST /api/inventory/parts", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    mockUserHasPermission.mockReturnValue(false);

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Part",
        sku: "NP-001",
        category: "electrical",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 401 when lacking permission", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Operator",
      employeeId: "OP-001",
      email: "op@example.com",
      pin: "hashed",
      roleId: "1",
      departmentId: "1",
      isActive: true,
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
    mockUserHasPermission.mockReturnValue(false);

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Part",
        sku: "NP-001",
        category: "electrical",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when missing required fields", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      employeeId: "ADMIN-001",
      email: "admin@example.com",
      pin: "hashed",
      roleId: "3",
      departmentId: "1",
      isActive: true,
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
    mockUserHasPermission.mockReturnValue(true);

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Part",
        // Missing sku and category
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("creates part successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      employeeId: "ADMIN-001",
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
    mockUserHasPermission.mockReturnValue(true);

    const mockPart = {
      id: "5", displayId: 5,
      name: "New Bearing",
      sku: "NB-001",
      barcode: null,
      description: "Standard ball bearing",
      category: "mechanical" as const,
      vendorId: "1",
      unitCost: 35.0,
      reorderPoint: 10,
      leadTimeDays: 7,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockInsertReturning.mockResolvedValue([mockPart]);

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Bearing",
        sku: "NB-001",
        category: "mechanical",
        unitCost: 35.0,
        reorderPoint: 10,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe("New Bearing");
    expect(data.data.sku).toBe("NB-001");
  });

  it("sets default values for optional fields", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      employeeId: "ADMIN-001",
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
    mockUserHasPermission.mockReturnValue(true);

    const mockPart = {
      id: "6", displayId: 6,
      name: "Basic Part",
      sku: "BP-001",
      barcode: null,
      description: null,
      category: "electrical" as const,
      vendorId: null,
      unitCost: 0,
      reorderPoint: 0,
      leadTimeDays: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let capturedValues: any;
    mockInsertValues.mockImplementation((vals: any) => {
      capturedValues = vals;
      return {
        returning: mockInsertReturning.mockResolvedValue([mockPart]),
      };
    });

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Basic Part",
        sku: "BP-001",
        category: "electrical",
        // Not providing reorderPoint or isActive
      }),
    });

    await POST(request);

    expect(capturedValues.reorderPoint).toBe(0);
    expect(capturedValues.isActive).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Admin",
      employeeId: "ADMIN-001",
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
    mockUserHasPermission.mockReturnValue(true);

    mockInsertReturning.mockRejectedValue(new Error("Duplicate SKU"));

    const request = new Request("http://localhost/api/inventory/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Part",
        sku: "EXISTING-SKU",
        category: "mechanical",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("Duplicate SKU");
  });
});

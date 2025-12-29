import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      spareParts: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  userHasPermission: vi.fn(),
  PERMISSIONS: {
    INVENTORY_CREATE: "inventory:create",
    INVENTORY_VIEW: "inventory:view",
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

import { GET, POST } from "@/app/api/inventory/parts/route";
import { db } from "@/db";
import { userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/inventory/parts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns parts list when authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const mockParts = [
      {
        id: 1,
        name: "Bearing",
        sku: "BRG-001",
        category: "mechanical",
        unitCost: 25.99,
        reorderPoint: 10,
        isActive: true,
      },
      {
        id: 2,
        name: "Motor",
        sku: "MTR-001",
        category: "electrical",
        unitCost: 150.0,
        reorderPoint: 5,
        isActive: true,
      },
    ];

    vi.mocked(db.query.spareParts.findMany).mockResolvedValue(mockParts);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].name).toBe("Bearing");
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

    vi.mocked(db.query.spareParts.findMany).mockRejectedValue(
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(userHasPermission).mockReturnValue(false);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });
    vi.mocked(userHasPermission).mockReturnValue(false);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    const mockPart = {
      id: 5,
      name: "New Bearing",
      sku: "NB-001",
      category: "mechanical",
      unitCost: 35.0,
      reorderPoint: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockPart]),
      })),
    } as unknown as ReturnType<typeof db.insert>);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    const mockPart = {
      id: 6,
      name: "Basic Part",
      sku: "BP-001",
      category: "electrical",
      reorderPoint: 0, // Default
      isActive: true, // Default
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let capturedValues: unknown;
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn((vals) => {
        capturedValues = vals;
        return {
          returning: vi.fn().mockResolvedValue([mockPart]),
        };
      }),
    } as unknown as ReturnType<typeof db.insert>);

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

    expect((capturedValues as Record<string, unknown>).reorderPoint).toBe(0);
    expect((capturedValues as Record<string, unknown>).isActive).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockRejectedValue(new Error("Duplicate SKU")),
      })),
    } as unknown as ReturnType<typeof db.insert>);

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

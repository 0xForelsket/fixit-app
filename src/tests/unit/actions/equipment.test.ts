import {
  createEquipment,
  deleteEquipment,
  updateEquipment,
} from "@/actions/equipment";
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
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("createEquipment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You don't have permission to create equipment");
  });

  it("should reject operator users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You don't have permission to create equipment");
  });

  it("should return error for invalid input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    const formData = new FormData();
    formData.set("name", ""); // Empty name
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBeDefined();
  });

  it("should create equipment successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    const mockEquipment = {
      id: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockEquipment]),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "tm-001"); // Lowercase - should be uppercased
    formData.set("locationId", "1");
    formData.set("departmentId", "1");

    const result = await createEquipment({}, formData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockEquipment);
  });

  it("should handle duplicate code error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi
          .fn()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: equipment.code")
          ),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");
    formData.set("departmentId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("A equipment with this code already exists");
  });
});

describe("updateEquipment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment(1, {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment(1, {}, formData);

    expect(result.error).toBe("You don't have permission to update equipment");
  });

  it("should return error for non-existent equipment", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment(999, {}, formData);

    expect(result.error).toBe("Equipment not found");
  });

  it("should update equipment successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Old Name",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it("should log status change", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    const formData = new FormData();
    formData.set("status", "down");

    const result = await updateEquipment(1, {}, formData);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });

  it("should handle duplicate code error on update", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({
        where: vi
          .fn()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: equipment.code")
          ),
      })),
    } as unknown);

    const formData = new FormData();
    formData.set("code", "EXISTING-CODE");

    const result = await updateEquipment(1, {}, formData);

    expect(result.error).toBe("A equipment with this code already exists");
  });
});

describe("deleteEquipment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const result = await deleteEquipment(1);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const result = await deleteEquipment(1);

    expect(result.error).toBe("You don't have permission to delete equipment");
  });

  it("should return error for non-existent equipment", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue(undefined);

    const result = await deleteEquipment(999);

    expect(result.error).toBe("Equipment not found");
  });

  it("should prevent deletion of equipment with tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [{ id: 1 }], // Has work orders
    } as unknown as Awaited<ReturnType<typeof db.query.equipment.findFirst>>);

    const result = await deleteEquipment(1);

    expect(result.error).toBe(
      "Cannot delete equipment with existing work orders"
    );
  });

  it("should delete equipment successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [], // No work orders
    } as unknown as Awaited<ReturnType<typeof db.query.equipment.findFirst>>);

    vi.mocked(db.delete as unknown as () => unknown).mockReturnValue({
      where: vi.fn(),
    } as unknown);

    const result = await deleteEquipment(1);

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});

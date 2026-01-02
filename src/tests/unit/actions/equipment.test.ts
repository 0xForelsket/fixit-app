import {
  createEquipment,
  deleteEquipment,
  updateEquipment,
} from "@/actions/equipment";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockFindFirst = mock();
const mockInsert = mock(() => ({
  values: mock(() => ({
    returning: mock(),
  })),
}));
const mockUpdate = mock(() => ({
  set: mock(() => ({
    where: mock(),
  })),
}));
const mockDelete = mock(() => ({
  where: mock(),
}));

// Mock the db module
mock.module("@/db", () => ({
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

const mockGetCurrentUser = mock();

// Mock auth module explicitly to avoid leakage
mock.module("@/lib/auth", () => ({
  userHasPermission: mock((user, permission) => {
    if (user?.permissions?.includes("*")) return true;
    return user?.permissions?.includes(permission) ?? false;
  }),
  PERMISSIONS: {
    EQUIPMENT_CREATE: "equipment:create",
    EQUIPMENT_UPDATE: "equipment:update",
    EQUIPMENT_DELETE: "equipment:delete",
  },
}));

// Mock session
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock audit
mock.module("@/lib/audit", () => ({
  logAudit: mock(),
}));

// Re-import after mocking
import { db } from "@/db";
// We don't import from @/lib/auth because we mocked it effectively for the action to use.
// But wait, the action might import PERMISSIONS from the real module if my mock module didn't replace it fully?
// mock.module("@/lib/auth", ...) replaces the module for everyone importing it via "@/lib/auth".

describe("createEquipment action", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You don't have permission to create equipment");
  });

  it("should reject operator users", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("name", "Test Equipment");
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBe("You don't have permission to create equipment");
  });

  it("should return error for invalid input", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("name", ""); // Empty name
    formData.set("code", "TM-001");
    formData.set("locationId", "1");

    const result = await createEquipment({}, formData);

    expect(result.error).toBeDefined();
  });

  it("should create equipment successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    const mockEquipment = {
      id: "1", displayId: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      departmentId: "1",
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockInsert.mockReturnValue({
      values: mock(() => ({
        returning: mock().mockResolvedValue([mockEquipment]),
      })),
    });

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
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockInsert.mockReturnValue({
      values: mock(() => ({
        returning: mock().mockRejectedValue(
          new Error("UNIQUE constraint failed: equipment.code")
        ),
      })),
    });

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
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment("1", {}, formData);

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment("1", {}, formData);

    expect(result.error).toBe("You don't have permission to update equipment");
  });

  it("should return error for non-existent equipment", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment("999", {}, formData);

    expect(result.error).toBe("Equipment not found");
  });

  it("should update equipment successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Old Name",
      code: "TM-001",
      locationId: "1",
      status: "operational" as const,
      ownerId: null,
      typeId: null,
      modelId: null,
      departmentId: "1",
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate.mockReturnValue({
      set: mock(() => ({ where: mock() })),
    });

    const formData = new FormData();
    formData.set("name", "Updated Name");

    const result = await updateEquipment("1", {}, formData);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should log status change", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      departmentId: "1",
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockInsert.mockReturnValue({
      values: mock(),
    });

    mockUpdate.mockReturnValue({
      set: mock(() => ({ where: mock() })),
    });

    const formData = new FormData();
    formData.set("status", "down");

    const result = await updateEquipment("1", {}, formData);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled(); // For status change log
  });

  it("should handle duplicate code error on update", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      departmentId: "1",
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate.mockReturnValue({
      set: mock(() => ({
        where: mock()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: equipment.code")
          ),
      })),
    });

    const formData = new FormData();
    formData.set("code", "EXISTING-CODE");

    const result = await updateEquipment("1", {}, formData);

    expect(result.error).toBe("A equipment with this code already exists");
  });
});

describe("deleteEquipment action", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await deleteEquipment("1");

    expect(result.error).toBe("You must be logged in");
  });

  it("should reject non-admin users", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const result = await deleteEquipment("1");

    expect(result.error).toBe("You don't have permission to delete equipment");
  });

  it("should return error for non-existent equipment", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue(undefined);

    const result = await deleteEquipment("999");

    expect(result.error).toBe("Equipment not found");
  });

  it("should prevent deletion of equipment with tickets", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [{ id: "1", displayId: 1 }], // Has work orders
    } as unknown as Awaited<ReturnType<typeof db.query.equipment.findFirst>>);

    const result = await deleteEquipment("1");

    expect(result.error).toBe(
      "Cannot delete equipment with existing work orders"
    );
  });

  it("should delete equipment successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirst.mockResolvedValue({
      id: "1", displayId: 1,
      name: "Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workOrders: [], // No work orders
    } as unknown as Awaited<ReturnType<typeof db.query.equipment.findFirst>>);

    mockDelete.mockReturnValue({
      where: mock(),
    });

    const result = await deleteEquipment("1");

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });
});

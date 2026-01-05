// Actions will be imported dynamically after mocks
import type { SessionUser } from "@/lib/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindFirstRole = vi.fn();
const mockFindFirstUser = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockOrderBy = vi.fn();
const mockRevalidatePath = vi.fn();

// Mock dependencies of db
mockSelect.mockReturnValue({
  from: mockFrom,
});

mockFrom.mockReturnValue({
  orderBy: mockOrderBy,
});

// Setup mockDelete to prevent crashes if called unexpectedly
mockDelete.mockReturnValue({
  where: vi.fn(),
});

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      roles: {
        findFirst: mockFindFirstRole,
      },
      users: {
        findFirst: mockFindFirstUser,
      },
    },
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

const mockRequirePermission = vi.fn();

// Import PERMISSIONS for use in mocks and tests
import { PERMISSIONS as PERMISSIONS_SOURCE } from "@/lib/permissions";

// Mock auth
vi.mock("@/lib/auth", () => ({
  requirePermission: mockRequirePermission,
  PERMISSIONS: PERMISSIONS_SOURCE,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Dynamic import
const { createRole, deleteRole, updateRole } = await import("@/actions/roles");

describe("roles actions", () => {
  const mockUser: SessionUser = {
    id: "1",
    displayId: 1,
    name: "Admin",
    employeeId: "ADMIN-001",
    roleId: "3",
    roleName: "admin",
    departmentId: "1",
    permissions: ["*"],
    hourlyRate: 50.0,
    sessionVersion: 1,
  };

  beforeEach(() => {
    mockFindFirstRole.mockClear();
    mockFindFirstUser.mockClear();
    mockSelect.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockRequirePermission.mockClear();
    mockRequirePermission.mockResolvedValue(mockUser);

    // Reset defaults
    mockUpdate.mockReturnValue({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    });
    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe("createRole", () => {
    it("should require permission", async () => {
      mockRequirePermission.mockRejectedValue(new Error("Forbidden"));

      const formData = new FormData();
      formData.set("name", "TestRole");

      await expect(createRole(formData)).rejects.toThrow("Forbidden");
    });

    it("should reject invalid role name", async () => {
      const formData = new FormData();
      formData.set("name", ""); // Empty name

      const result = await createRole(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should reject duplicate role name", async () => {
      mockFindFirstRole.mockResolvedValue({
        id: "1",
        displayId: 1,
        name: "existing-role",
        description: null,
        permissions: [],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.set("name", "existing-role");
      formData.append("permissions", "ticket:view");

      const result = await createRole(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("A role with this name already exists");
      }
    });

    it("should create role successfully", async () => {
      mockFindFirstRole.mockResolvedValue(undefined);
      mockInsert.mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: "5", displayId: 5 }]),
        })),
      });

      const formData = new FormData();
      formData.set("name", "new-role");
      formData.set("description", "A new custom role");
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:create");

      const result = await createRole(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe("5");
      }
    });
  });

  describe("updateRole", () => {
    it("should return error for non-existent role", async () => {
      mockFindFirstRole.mockResolvedValue(undefined);

      const formData = new FormData();
      formData.set("name", "Updated Name");

      const result = await updateRole("999", formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should reject updates to system roles", async () => {
      mockFindFirstRole.mockResolvedValue({
        id: "1",
        displayId: 1,
        name: "admin",
        description: "System administrator",
        permissions: ["*"],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.set("name", "hacked-admin");

      const result = await updateRole("1", formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("System roles cannot be modified");
      }
    });

    it("should reject duplicate name when renaming", async () => {
      // First call: find the role being updated
      mockFindFirstRole
        .mockResolvedValueOnce({
          id: "5",
          displayId: 5,
          name: "custom-role",
          description: null,
          permissions: ["ticket:view"],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Second call: check for existing role with new name
        .mockResolvedValueOnce({
          id: "6",
          displayId: 6,
          name: "existing-role",
          description: null,
          permissions: [],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const formData = new FormData();
      formData.set("name", "existing-role");

      const result = await updateRole("5", formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("A role with this name already exists");
      }
    });

    it("should update role successfully", async () => {
      mockFindFirstRole
        .mockResolvedValueOnce({
          id: "5",
          displayId: 5,
          name: "custom-role",
          description: null,
          permissions: ["ticket:view"],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(undefined); // No duplicate name

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      });

      const formData = new FormData();
      formData.set("name", "updated-role");
      formData.set("description", "Updated description");
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:update");

      const result = await updateRole("5", formData);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should allow updating same name (no rename)", async () => {
      mockFindFirstRole.mockResolvedValueOnce({
        id: "5",
        displayId: 5,
        name: "custom-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      });

      const formData = new FormData();
      formData.set("name", "custom-role"); // Same name
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:create");

      const result = await updateRole("5", formData);

      expect(result.success).toBe(true);
    });
  });

  describe("deleteRole", () => {
    it("should return error for non-existent role", async () => {
      mockFindFirstRole.mockResolvedValue(undefined);

      const result = await deleteRole("999");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should reject deletion of system roles", async () => {
      mockFindFirstRole.mockResolvedValue({
        id: "1",
        displayId: 1,
        name: "admin",
        description: "System administrator",
        permissions: ["*"],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await deleteRole("1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("System roles cannot be deleted");
      }
    });

    it("should reject deletion when users are assigned", async () => {
      mockFindFirstRole.mockResolvedValueOnce({
        id: "5",
        displayId: 5,
        name: "custom-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFindFirstUser.mockResolvedValue({
        id: "10",
        displayId: 10,
        employeeId: "EMP-001",
        name: "Test User",
        pin: "hashed",
        roleId: "5",
        isActive: true,
        hourlyRate: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        email: null,
        departmentId: null,
        preferences: null,
        sessionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await deleteRole("5");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("users are still assigned");
      }
    });

    it("should delete role successfully when no users assigned", async () => {
      mockFindFirstRole.mockResolvedValueOnce({
        id: "5",
        displayId: 5,
        name: "unused-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFindFirstUser.mockResolvedValue(undefined);

      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await deleteRole("5");

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});

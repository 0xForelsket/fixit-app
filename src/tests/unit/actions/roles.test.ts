import { createRole, deleteRole, updateRole } from "@/actions/roles";
import type { SessionUser } from "@/lib/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      roles: {
        findFirst: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(),
      })),
    })),
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

// Mock auth
vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

import { db } from "@/db";
import { requirePermission } from "@/lib/auth";

describe("roles actions", () => {
  const mockUser: SessionUser = {
    id: 1,
    name: "Admin",
    employeeId: "ADMIN-001",
    roleId: 3,
    roleName: "admin",
    departmentId: 1,
    permissions: ["*"],
    hourlyRate: 50.0,
    sessionVersion: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePermission).mockResolvedValue(mockUser);
  });

  describe("createRole", () => {
    it("should require permission", async () => {
      vi.mocked(requirePermission).mockRejectedValue(new Error("Forbidden"));

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
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
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
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 5 }]),
        })),
      } as unknown as ReturnType<typeof db.insert>);

      const formData = new FormData();
      formData.set("name", "new-role");
      formData.set("description", "A new custom role");
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:create");

      const result = await createRole(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe(5);
      }
    });
  });

  describe("updateRole", () => {
    it("should return error for non-existent role", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.set("name", "Updated Name");

      const result = await updateRole(999, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should reject updates to system roles", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
        name: "admin",
        description: "System administrator",
        permissions: ["*"],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.set("name", "hacked-admin");

      const result = await updateRole(1, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("System roles cannot be modified");
      }
    });

    it("should reject duplicate name when renaming", async () => {
      // First call: find the role being updated
      vi.mocked(db.query.roles.findFirst)
        .mockResolvedValueOnce({
          id: 5,
          name: "custom-role",
          description: null,
          permissions: ["ticket:view"],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Second call: check for existing role with new name
        .mockResolvedValueOnce({
          id: 6,
          name: "existing-role",
          description: null,
          permissions: [],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const formData = new FormData();
      formData.set("name", "existing-role");

      const result = await updateRole(5, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("A role with this name already exists");
      }
    });

    it("should update role successfully", async () => {
      vi.mocked(db.query.roles.findFirst)
        .mockResolvedValueOnce({
          id: 5,
          name: "custom-role",
          description: null,
          permissions: ["ticket:view"],
          isSystemRole: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(undefined); // No duplicate name

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      } as unknown as ReturnType<typeof db.update>);

      const formData = new FormData();
      formData.set("name", "updated-role");
      formData.set("description", "Updated description");
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:update");

      const result = await updateRole(5, formData);

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it("should allow updating same name (no rename)", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
        id: 5,
        name: "custom-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      } as unknown as ReturnType<typeof db.update>);

      const formData = new FormData();
      formData.set("name", "custom-role"); // Same name
      formData.append("permissions", "ticket:view");
      formData.append("permissions", "ticket:create");

      const result = await updateRole(5, formData);

      expect(result.success).toBe(true);
    });
  });

  describe("deleteRole", () => {
    it("should return error for non-existent role", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(undefined);

      const result = await deleteRole(999);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Role not found");
      }
    });

    it("should reject deletion of system roles", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
        name: "admin",
        description: "System administrator",
        permissions: ["*"],
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await deleteRole(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("System roles cannot be deleted");
      }
    });

    it("should reject deletion when users are assigned", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
        id: 5,
        name: "custom-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 10,
        employeeId: "EMP-001",
        name: "Test User",
        pin: "hashed",
        roleId: 5,
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

      const result = await deleteRole(5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("users are still assigned");
      }
    });

    it("should delete role successfully when no users assigned", async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValueOnce({
        id: 5,
        name: "unused-role",
        description: null,
        permissions: ["ticket:view"],
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as unknown as ReturnType<typeof db.delete>);

      const result = await deleteRole(5);

      expect(result.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });
  });
});

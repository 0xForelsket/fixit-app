import { createUser, deleteUser, updateUser } from "@/actions/users";
import { users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import type { SessionUser } from "@/lib/session";
import { getCurrentUser } from "@/lib/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock DB - use vi.hoisted to avoid hoisting issues with vi.mock factory
const mockTx = vi.hoisted(() => ({
  query: {
    users: {
      findFirst: vi.fn(),
    },
    roles: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: mockTx,
}));

describe("User Actions", () => {
  const mockUser: SessionUser = {
    id: 1,
    name: "Admin User",
    employeeId: "ADMIN-001",
    roleId: 1,
    roleName: "admin",
    departmentId: 1,
    sessionVersion: 1, permissions: ["*"],
    hourlyRate: 50.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(requirePermission).mockResolvedValue(mockUser);
  });

  describe("createUser", () => {
    const validFormData = new FormData();
    validFormData.append("employeeId", "TEST-001");
    validFormData.append("name", "Test User");
    validFormData.append("pin", "1234");
    validFormData.append("roleId", "2");
    validFormData.append("isActive", "true");

    it("should create user successfully", async () => {
      // Mock role check
      mockTx.query.roles.findFirst.mockResolvedValue({ id: 2, name: "tech" });
      // Mock duplicate check
      mockTx.query.users.findFirst.mockResolvedValue(null);
      // Mock insert return
      mockTx.returning.mockResolvedValue([{ id: 10 }]);

      const result = await createUser(validFormData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 10 });
      }
      expect(mockTx.insert).toHaveBeenCalledWith(users);
    });

    it("should fail if employee ID exists", async () => {
      mockTx.query.users.findFirst.mockResolvedValue({ id: 5 });

      const result = await createUser(validFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Employee ID already exists");
      }
    });

    it("should fail if role does not exist", async () => {
      // First check (duplicate user) returns null
      mockTx.query.users.findFirst.mockResolvedValue(null);
      // Role check returns null
      mockTx.query.roles.findFirst.mockResolvedValue(null);

      const result = await createUser(validFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Selected role does not exist");
      }
    });
  });

  describe("updateUser", () => {
    const userId = 5;
    const updateFormData = new FormData();
    updateFormData.append("name", "Updated Name");

    it("should update user successfully", async () => {
      mockTx.query.users.findFirst.mockResolvedValue({
        id: userId,
        email: "test@example.com",
      });

      const result = await updateUser(userId, updateFormData);

      expect(result.success).toBe(true);
      expect(mockTx.update).toHaveBeenCalledWith(users);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Updated Name" })
      );
    });

    it("should fail if user not found", async () => {
      mockTx.query.users.findFirst.mockResolvedValue(null);

      const result = await updateUser(userId, updateFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });
  });

  describe("deleteUser", () => {
    const targetUserId = 5;

    it("should delete user (soft delete) successfully", async () => {
      mockTx.query.users.findFirst.mockResolvedValue({ id: targetUserId });

      const result = await deleteUser(targetUserId);

      expect(result.success).toBe(true);
      expect(mockTx.update).toHaveBeenCalledWith(users);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    it("should prevent self-deletion", async () => {
      mockTx.query.users.findFirst.mockResolvedValue({ id: mockUser.id });

      const result = await deleteUser(mockUser.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("You cannot delete your own account");
      }
    });
  });
});

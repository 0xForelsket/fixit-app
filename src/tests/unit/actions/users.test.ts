// Actions will be imported dynamically after mocks
import { users } from "@/db/schema";
import { PERMISSIONS as PERMISSIONS_SOURCE } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session";
import { beforeEach, describe, expect, it,vi } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockRequirePermission = vi.fn();
const mockHashPin = vi.fn((pin) => Promise.resolve(`hashed_${pin}`));
const mockRevalidatePath = vi.fn();

const mockFindFirstUser = vi.fn();
const mockFindFirstRole = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockDelete = vi.fn();

// Chainable mocks
mockInsert.mockReturnValue({ values: mockValues });
mockValues.mockReturnValue({ returning: mockReturning });
mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockDelete.mockReturnValue({ where: mockWhere }); // Add return for delete

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mockRequirePermission,
  hashPin: mockHashPin,
  hasPermission: vi.fn((userPermissions: string[], required: string) => {
    if (userPermissions.includes("*")) return true;
    return userPermissions.includes(required);
  }),
  userHasPermission: vi.fn((user, permission) => {
    if (user?.permissions?.includes("*")) return true;
    return user?.permissions?.includes(permission);
  }),
  PERMISSIONS: PERMISSIONS_SOURCE,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: mockFindFirstUser,
      },
      roles: {
        findFirst: mockFindFirstRole,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete, // Add delete
  },
}));

// Import actions dynamically
const { createUser, deleteUser, updateUser } = await import("@/actions/users");

describe("users actions", () => {
  const mockUser: SessionUser = {
    id: "1", displayId: 1,
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
    mockGetCurrentUser.mockClear();
    mockRequirePermission.mockClear();
    mockHashPin.mockClear();
    mockRevalidatePath.mockClear();
    mockFindFirstUser.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
    mockUpdate.mockClear();
    mockSet.mockClear();
    mockWhere.mockClear();
    mockDelete.mockClear(); // Clear delete mock

    // Setup default mock behaviors
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockRequirePermission.mockResolvedValue(mockUser);
  });

  describe("createUser", () => {
    it("should return error if unauthorized", async () => {
      mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

      const formData = new FormData();

      await expect(createUser(formData)).rejects.toThrow("Unauthorized");
    });

    it("should return error if role not found", async () => {
      mockFindFirstRole.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("roleId", "999");
      formData.set("employeeId", "TEST-001");
      formData.set("name", "Test User");
      formData.set("pin", "123456");

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Selected role does not exist");
      }
    });

    it("should return error if employee ID already exists", async () => {
      mockFindFirstRole.mockResolvedValue({ id: "2" });
      mockFindFirstUser.mockResolvedValue({ id: "5" }); // User exists

      const formData = new FormData();
      formData.set("roleId", "2");
      formData.set("employeeId", "EXISTING");
      formData.set("name", "Test User");
      formData.set("pin", "123456");

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("A user with this Employee ID already exists");
      }
    });

    it("should create user successfully", async () => {
      mockFindFirstRole.mockResolvedValue({ id: "2" });
      mockFindFirstUser.mockResolvedValue(null); // No existing user
      mockReturning.mockResolvedValue([{ id: "10", displayId: 10 }]);

      const formData = new FormData();
      formData.set("roleId", "2");
      formData.set("employeeId", "NEW-001");
      formData.set("name", "New User");
      formData.set("pin", "123456");

      const result = await createUser(formData);

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(users);
      expect(mockHashPin).toHaveBeenCalledWith("123456");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    });
  });

  describe("updateUser", () => {
    it("should return error if unauthorized", async () => {
      mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

      const formData = new FormData();

      await expect(updateUser("1", formData)).rejects.toThrow("Unauthorized");
    });

    it("should return error if user not found", async () => {
      mockFindFirstUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("name", "Updated Name");

      const result = await updateUser("999", formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("should update user successfully", async () => {
      mockFindFirstUser.mockResolvedValue({ id: "1", displayId: 1 });
      mockFindFirstRole.mockResolvedValue({ id: "2" });

      const formData = new FormData();
      formData.set("name", "Updated Name");
      formData.set("roleId", "2");

      const result = await updateUser("1", formData);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(users);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    });

    it("should update pin if provided", async () => {
      mockFindFirstUser.mockResolvedValue({ id: "1", displayId: 1 });

      const formData = new FormData();
      formData.set("pin", "654321");

      const result = await updateUser("1", formData);

      expect(result.success).toBe(true);
      expect(mockHashPin).toHaveBeenCalledWith("654321");
    });
  });

  describe("deleteUser", () => {
    it("should return error if unauthorized", async () => {
      mockRequirePermission.mockRejectedValue(new Error("Unauthorized"));

      await expect(deleteUser("1")).rejects.toThrow("Unauthorized");
    });

    it("should return error if user not found", async () => {
      mockFindFirstUser.mockResolvedValue(null);

      const result = await deleteUser("999");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("should prevent deleting self", async () => {
      mockFindFirstUser.mockResolvedValue({ id: "1", displayId: 1 });
      // mockUser.id is "1"

      const result = await deleteUser("1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("You cannot delete your own account");
      }
    });

    it("should delete user successfully", async () => {
      mockFindFirstUser.mockResolvedValue({ id: "2", displayId: 2 });
      // mockUser.id is "1", deleting "2"
      // Note: deleteUser performs a soft-delete (sets isActive: false), not a hard delete

      const result = await deleteUser("2");

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(users);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    });
  });
});

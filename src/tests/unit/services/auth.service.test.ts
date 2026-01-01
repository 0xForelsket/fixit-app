import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      roles: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("@/lib/auth", () => ({
  verifyPin: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/permissions", () => ({
  getLegacyRolePermissions: vi.fn(() => ["work_orders:read"]),
}));

import { db } from "@/db";
import { verifyPin } from "@/lib/auth";
import { authLogger } from "@/lib/logger";
import { authenticateUser } from "@/lib/services/auth.service";
import { createSession } from "@/lib/session";

describe("Auth Service", () => {
  const mockUser = {
    id: 1,
    employeeId: "EMP-001",
    name: "Test User",
    email: "test@example.com",
    pin: "hashed_pin",
    roleId: 1,
    departmentId: 1,
    isActive: true,
    hourlyRate: 25.0,
    preferences: {
      theme: "light" as const,
      density: "comfortable" as const,
      notifications: { email: true },
    },
    failedLoginAttempts: 0,
    lockedUntil: null,
    sessionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRole = {
    id: 1,
    name: "operator",
    description: "Operator role",
    isSystemRole: false,
    permissions: ["work_orders:read", "work_orders:write"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticateUser", () => {
    it("returns error for non-existent user", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

      const result = await authenticateUser("INVALID-ID", "1234");

      expect(result).toEqual({
        success: false,
        error: "Invalid employee ID or PIN",
        status: 401,
      });
    });

    it("returns error for inactive user", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await authenticateUser("EMP-001", "1234");

      expect(result).toEqual({
        success: false,
        error: "Account is disabled. Please contact an administrator.",
        status: 403,
      });
    });

    it("returns error for locked account", async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60000); // 10 minutes from now
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        lockedUntil,
      });

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Account is locked");
        expect(result.error).toContain("minute");
        expect(result.status).toBe(403);
      }
      expect(authLogger.warn).toHaveBeenCalled();
    });

    it("returns error for invalid PIN", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(verifyPin).mockResolvedValue(false);

      const result = await authenticateUser("EMP-001", "wrong");

      expect(result).toEqual({
        success: false,
        error: "Invalid employee ID or PIN",
        status: 401,
      });
      expect(db.update).toHaveBeenCalled();
    });

    it("increments failed attempts on wrong PIN", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 2,
      });
      vi.mocked(verifyPin).mockResolvedValue(false);

      await authenticateUser("EMP-001", "wrong");

      expect(db.update).toHaveBeenCalled();
      expect(authLogger.info).toHaveBeenCalled();
    });

    it("locks account after 5 failed attempts", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
      });
      vi.mocked(verifyPin).mockResolvedValue(false);

      const result = await authenticateUser("EMP-001", "wrong");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Too many failed attempts");
        expect(result.error).toContain("locked for 15 minutes");
        expect(result.status).toBe(403);
      }
      expect(authLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 5 }),
        expect.any(String)
      );
    });

    it("authenticates successfully with valid credentials", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(mockRole);
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token-123");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual({
          id: 1,
          employeeId: "EMP-001",
          name: "Test User",
          roleName: "operator",
          roleId: 1,
          departmentId: 1,
          sessionVersion: 1,
          permissions: ["work_orders:read", "work_orders:write"],
          hourlyRate: 25.0,
        });
        expect(result.csrfToken).toBe("csrf-token-123");
      }
    });

    it("resets failed attempts on successful login", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 3,
      });
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(mockRole);
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token");

      await authenticateUser("EMP-001", "1234");

      expect(db.update).toHaveBeenCalled();
    });

    it("logs successful login", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(mockRole);
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token");

      await authenticateUser("EMP-001", "1234");

      expect(authLogger.info).toHaveBeenCalledWith(
        { employeeId: "EMP-001", role: "operator" },
        "Successful login"
      );
    });

    it("uses legacy permissions when role has none", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        ...mockRole,
        permissions: [],
      });
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.permissions).toEqual(["work_orders:read"]);
      }
    });

    it("uses operator role name when user has no role", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        roleId: null,
      });
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.roleName).toBe("operator");
      }
    });

    it("allows login when lock has expired", async () => {
      const expiredLock = new Date(Date.now() - 60000); // 1 minute ago
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        lockedUntil: expiredLock,
      });
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(mockRole);
      vi.mocked(verifyPin).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
    });
  });
});

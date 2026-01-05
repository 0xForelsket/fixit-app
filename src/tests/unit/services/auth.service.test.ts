import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindFirstUser = vi.fn();
const mockFindFirstRole = vi.fn();
const mockUpdate = vi.fn();
const mockVerifyPin = vi.fn();
const mockCreateSession = vi.fn();
const mockAuthLoggerInfo = vi.fn();
const mockAuthLoggerWarn = vi.fn();
const mockAuthLoggerError = vi.fn();

// Mock dependencies
vi.vi.fn("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: mockFindFirstUser,
      },
      roles: {
        findFirst: mockFindFirstRole,
      },
    },
    update: mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
    }),
  },
}));

vi.vi.fn("@/lib/auth", () => ({
  verifyPin: mockVerifyPin,
}));

vi.vi.fn("@/lib/session", () => ({
  createSession: mockCreateSession,
}));

vi.vi.fn("@/lib/logger", () => ({
  authLogger: {
    info: mockAuthLoggerInfo,
    warn: mockAuthLoggerWarn,
    error: mockAuthLoggerError,
  },
}));

vi.vi.fn("@/lib/permissions", () => ({
  getLegacyRolePermissions: vi.fn(() => ["work_orders:read"]),
}));

const { authenticateUser } = await import("@/lib/services/auth.service");

describe("Auth Service", () => {
  const mockUser = {
    id: "1", displayId: 1,
    employeeId: "EMP-001",
    name: "Test User",
    email: "test@example.com",
    pin: "hashed_pin",
    roleId: "1",
    departmentId: "1",
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
    id: "1", displayId: 1,
    name: "operator",
    description: "Operator role",
    isSystemRole: false,
    permissions: ["work_orders:read", "work_orders:write"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockFindFirstUser.mockClear();
    mockFindFirstRole.mockClear();
    mockUpdate.mockClear();
    mockVerifyPin.mockClear();
    mockCreateSession.mockClear();
    mockAuthLoggerInfo.mockClear();
    mockAuthLoggerWarn.mockClear();
    mockAuthLoggerError.mockClear();
    // Reset the update mock chain
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
    });
  });

  describe("authenticateUser", () => {
    it("returns error for non-existent user", async () => {
      mockFindFirstUser.mockResolvedValue(undefined);

      const result = await authenticateUser("INVALID-ID", "1234");

      expect(result).toEqual({
        success: false,
        error: "Invalid employee ID or PIN",
        status: 401,
      });
    });

    it("returns error for inactive user", async () => {
      mockFindFirstUser.mockResolvedValue({
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
      mockFindFirstUser.mockResolvedValue({
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
      expect(mockAuthLoggerWarn).toHaveBeenCalled();
    });

    it("returns error for invalid PIN", async () => {
      mockFindFirstUser.mockResolvedValue(mockUser);
      mockVerifyPin.mockResolvedValue(false);

      const result = await authenticateUser("EMP-001", "wrong");

      expect(result).toEqual({
        success: false,
        error: "Invalid employee ID or PIN",
        status: 401,
      });
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("increments failed attempts on wrong PIN", async () => {
      mockFindFirstUser.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 2,
      });
      mockVerifyPin.mockResolvedValue(false);

      await authenticateUser("EMP-001", "wrong");

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockAuthLoggerInfo).toHaveBeenCalled();
    });

    it("locks account after 5 failed attempts", async () => {
      mockFindFirstUser.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
      });
      mockVerifyPin.mockResolvedValue(false);

      const result = await authenticateUser("EMP-001", "wrong");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Too many failed attempts");
        expect(result.error).toContain("locked for 15 minutes");
        expect(result.status).toBe(403);
      }
      expect(mockAuthLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 5 }),
        expect.any(String)
      );
    });

    it("authenticates successfully with valid credentials", async () => {
      mockFindFirstUser.mockResolvedValue(mockUser);
      mockFindFirstRole.mockResolvedValue(mockRole);
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token-123");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual({
          id: "1", displayId: 1,
          employeeId: "EMP-001",
          name: "Test User",
          roleName: "operator",
          roleId: "1",
          departmentId: "1",
          sessionVersion: 1,
          permissions: ["work_orders:read", "work_orders:write"],
          hourlyRate: 25.0,
        });
        expect(result.csrfToken).toBe("csrf-token-123");
      }
    });

    it("resets failed attempts on successful login", async () => {
      mockFindFirstUser.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 3,
      });
      mockFindFirstRole.mockResolvedValue(mockRole);
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token");

      await authenticateUser("EMP-001", "1234");

      expect(mockUpdate).toHaveBeenCalled();
    });

    it("logs successful login", async () => {
      mockFindFirstUser.mockResolvedValue(mockUser);
      mockFindFirstRole.mockResolvedValue(mockRole);
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token");

      await authenticateUser("EMP-001", "1234");

      expect(mockAuthLoggerInfo).toHaveBeenCalledWith(
        { employeeId: "EMP-001", role: "operator" },
        "Successful login"
      );
    });

    it("uses legacy permissions when role has none", async () => {
      mockFindFirstUser.mockResolvedValue(mockUser);
      mockFindFirstRole.mockResolvedValue({
        ...mockRole,
        permissions: [],
      });
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.permissions).toEqual(["work_orders:read"]);
      }
    });

    it("uses operator role name when user has no role", async () => {
      mockFindFirstUser.mockResolvedValue({
        ...mockUser,
        roleId: null,
      });
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.roleName).toBe("operator");
      }
    });

    it("allows login when lock has expired", async () => {
      const expiredLock = new Date(Date.now() - 60000); // 1 minute ago
      mockFindFirstUser.mockResolvedValue({
        ...mockUser,
        lockedUntil: expiredLock,
      });
      mockFindFirstRole.mockResolvedValue(mockRole);
      mockVerifyPin.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue("csrf-token");

      const result = await authenticateUser("EMP-001", "1234");

      expect(result.success).toBe(true);
    });
  });
});

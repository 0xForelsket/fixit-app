import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock cookie store
const mockCookieGet = mock();
const mockCookieSet = mock();
const mockCookieDelete = mock();
const mockCookieStore = {
  get: mockCookieGet,
  set: mockCookieSet,
  delete: mockCookieDelete,
};

// Mock functions that will be used
const mockJwtVerify = mock();
const mockHasPermission = mock();
const mockHasAnyPermission = mock();
const mockIsSessionVersionValid = mock(() => Promise.resolve(true));

// Mock next/headers
mock.module("next/headers", () => ({
  cookies: mock(() => Promise.resolve(mockCookieStore)),
}));

// Mock jose
mock.module("jose", () => ({
  SignJWT: mock(() => ({
    setProtectedHeader: mock(() => ({
      setIssuedAt: mock(() => ({
        setExpirationTime: mock(() => ({
          sign: mock(() => Promise.resolve("mock-jwt-token")),
        })),
      })),
    })),
  })),
  jwtVerify: mockJwtVerify,
}));

// Mock permissions
const mockPERMISSIONS = {
  MAINTENANCE_VIEW: "maintenance:view",
  SYSTEM_SETTINGS: "system:settings",
  TICKET_VIEW: "ticket:view",
  USER_CREATE: "user:create",
};

mock.module("@/lib/permissions", () => ({
  PERMISSIONS: mockPERMISSIONS,
  hasPermission: mockHasPermission,
  hasAnyPermission: mockHasAnyPermission,
}));

// Mock session-validator
mock.module("@/lib/session-validator", () => ({
  isSessionVersionValid: mockIsSessionVersionValid,
}));

// Set environment variable
process.env.SESSION_SECRET =
  "test-secret-key-that-is-at-least-32-characters-long";

import type { SessionUser } from "@/lib/session";

const {
  createSession,
  deleteSession,
  getCurrentUser,
  getSession,
  refreshSessionIfNeeded,
  requireAnyPermission,
  requireAuth,
  requireCsrf,
  requirePermission,
  verifyCsrfToken,
} = await import("@/lib/session");

describe("Session Utilities", () => {
  const mockUser: SessionUser = {
    id: "user-1",
    displayId: 1,
    employeeId: "EMP-001",
    name: "Test User",
    roleName: "operator",
    roleId: "role-1",
    departmentId: "dept-1",
    sessionVersion: 1,
    permissions: [mockPERMISSIONS.MAINTENANCE_VIEW],
    hourlyRate: 20.0,
  };

  beforeEach(() => {
    mockCookieGet.mockClear();
    mockCookieSet.mockClear();
    mockCookieDelete.mockClear();
    mockJwtVerify.mockClear();
    mockHasPermission.mockClear();
    mockHasAnyPermission.mockClear();
    mockIsSessionVersionValid.mockClear();
    mockIsSessionVersionValid.mockReturnValue(Promise.resolve(true));
  });

  describe("createSession", () => {
    it("creates session and sets cookies", async () => {
      const csrfToken = await createSession(mockUser);

      expect(typeof csrfToken).toBe("string");
      expect(csrfToken.length).toBe(64); // 32 bytes as hex = 64 chars
      expect(mockCookieSet).toHaveBeenCalledTimes(3);
    });

    it("sets httpOnly session cookie", async () => {
      await createSession(mockUser);

      expect(mockCookieSet).toHaveBeenCalledWith(
        "fixit_session",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );
    });

    it("sets session expiry cookie", async () => {
      await createSession(mockUser);

      expect(mockCookieSet).toHaveBeenCalledWith(
        "fixit_session_exp",
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: "lax",
        })
      );
    });

    it("sets CSRF cookie with strict sameSite", async () => {
      await createSession(mockUser);

      expect(mockCookieSet).toHaveBeenCalledWith(
        "fixit_csrf",
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          sameSite: "strict",
        })
      );
    });
  });

  describe("getSession", () => {
    it("returns null when no session cookie", async () => {
      mockCookieGet.mockReturnValue(null);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when cookie value is empty", async () => {
      mockCookieGet.mockReturnValue({ value: "" });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when JWT verification fails", async () => {
      mockCookieGet.mockReturnValue({ value: "invalid-token" });
      mockJwtVerify.mockRejectedValue(new Error("Invalid token"));

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when session is expired", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() - 1000, // Expired
          csrfToken: "csrf-token",
        },
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns session when valid", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      const payload = {
        user: mockUser,
        expiresAt: Date.now() + 100000,
        csrfToken: "csrf-token",
      };
      mockJwtVerify.mockResolvedValue({ payload });

      const session = await getSession();

      expect(session).toEqual(payload);
    });
  });

  describe("deleteSession", () => {
    it("deletes all session cookies", async () => {
      await deleteSession();

      expect(mockCookieDelete).toHaveBeenCalledWith("fixit_session");
      expect(mockCookieDelete).toHaveBeenCalledWith("fixit_session_exp");
      expect(mockCookieDelete).toHaveBeenCalledWith("fixit_csrf");
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no session", async () => {
      mockCookieGet.mockReturnValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns user from valid session", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });
  });

  describe("requireAuth", () => {
    it("throws error when not authenticated", async () => {
      mockCookieGet.mockReturnValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("returns user when authenticated", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      });

      const user = await requireAuth();

      expect(user).toEqual(mockUser);
    });
  });

  describe("requirePermission", () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      });
    });

    it("throws Forbidden when user lacks permission", async () => {
      mockHasPermission.mockReturnValue(false);

      await expect(
        requirePermission(mockPERMISSIONS.SYSTEM_SETTINGS)
      ).rejects.toThrow("Forbidden");
    });

    it("returns user when permission granted", async () => {
      mockHasPermission.mockReturnValue(true);

      const user = await requirePermission(mockPERMISSIONS.TICKET_VIEW);

      expect(user).toEqual(mockUser);
    });
  });

  describe("requireAnyPermission", () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      });
    });

    it("throws Forbidden when user lacks all permissions", async () => {
      mockHasAnyPermission.mockReturnValue(false);

      await expect(
        requireAnyPermission([
          mockPERMISSIONS.SYSTEM_SETTINGS,
          mockPERMISSIONS.USER_CREATE,
        ])
      ).rejects.toThrow("Forbidden");
    });

    it("returns user when any permission granted", async () => {
      mockHasAnyPermission.mockReturnValue(true);

      const user = await requireAnyPermission([
        mockPERMISSIONS.TICKET_VIEW,
        mockPERMISSIONS.SYSTEM_SETTINGS,
      ]);

      expect(user).toEqual(mockUser);
    });
  });

  describe("verifyCsrfToken", () => {
    it("returns false when no session", async () => {
      mockCookieGet.mockReturnValue(null);

      const result = await verifyCsrfToken("some-token");

      expect(result).toBe(false);
    });

    it("returns false when token does not match", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      });

      const result = await verifyCsrfToken("wrong-token");

      expect(result).toBe(false);
    });

    it("returns true when token matches", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      });

      const result = await verifyCsrfToken("correct-token");

      expect(result).toBe(true);
    });
  });

  describe("requireCsrf", () => {
    it("throws error when CSRF header missing", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "POST",
      });

      await expect(requireCsrf(request)).rejects.toThrow("CSRF token missing");
    });

    it("throws error when CSRF token invalid", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      });

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "wrong-token" },
      });

      await expect(requireCsrf(request)).rejects.toThrow("CSRF token invalid");
    });

    it("passes when CSRF token is valid", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      });

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "correct-token" },
      });

      await expect(requireCsrf(request)).resolves.toBeUndefined();
    });
  });

  describe("refreshSessionIfNeeded", () => {
    it("does nothing when no session", async () => {
      mockCookieGet.mockReturnValue(null);

      await refreshSessionIfNeeded();

      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("does not refresh when session has more than 1 hour left", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
          csrfToken: "csrf-token",
        },
      });

      await refreshSessionIfNeeded();

      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("refreshes session when less than 1 hour left", async () => {
      mockCookieGet.mockReturnValue({ value: "valid-token" });
      mockJwtVerify.mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
          csrfToken: "csrf-token",
        },
      });

      await refreshSessionIfNeeded();

      expect(mockCookieSet).toHaveBeenCalled();
    });
  });
});

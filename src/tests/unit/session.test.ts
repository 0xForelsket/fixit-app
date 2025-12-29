import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/headers
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn(() => ({
      setIssuedAt: vi.fn(() => ({
        setExpirationTime: vi.fn(() => ({
          sign: vi.fn(() => Promise.resolve("mock-jwt-token")),
        })),
      })),
    })),
  })),
  jwtVerify: vi.fn(),
}));

// Mock permissions
vi.mock("@/lib/permissions", () => ({
  hasPermission: vi.fn(),
  hasAnyPermission: vi.fn(),
}));

// Set environment variable
process.env.SESSION_SECRET = "test-secret-key-that-is-at-least-32-characters-long";

import {
  createSession,
  getSession,
  deleteSession,
  getCurrentUser,
  requireAuth,
  requirePermission,
  requireAnyPermission,
  verifyCsrfToken,
  requireCsrf,
  refreshSessionIfNeeded,
  type SessionUser,
} from "@/lib/session";
import { jwtVerify } from "jose";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";

describe("Session Utilities", () => {
  const mockUser: SessionUser = {
    id: 1,
    employeeId: "EMP-001",
    name: "Test User",
    roleName: "operator",
    roleId: 1,
    permissions: ["work_orders:read"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("creates session and sets cookies", async () => {
      const csrfToken = await createSession(mockUser);

      expect(typeof csrfToken).toBe("string");
      expect(csrfToken.length).toBe(64); // 32 bytes as hex = 64 chars
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
    });

    it("sets httpOnly session cookie", async () => {
      await createSession(mockUser);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
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

      expect(mockCookieStore.set).toHaveBeenCalledWith(
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

      expect(mockCookieStore.set).toHaveBeenCalledWith(
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
      mockCookieStore.get.mockReturnValue(null);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when cookie value is empty", async () => {
      mockCookieStore.get.mockReturnValue({ value: "" });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when JWT verification fails", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
      vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns null when session is expired", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() - 1000, // Expired
          csrfToken: "csrf-token",
        },
      } as never);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("returns session when valid", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      const payload = {
        user: mockUser,
        expiresAt: Date.now() + 100000,
        csrfToken: "csrf-token",
      };
      vi.mocked(jwtVerify).mockResolvedValue({ payload } as never);

      const session = await getSession();

      expect(session).toEqual(payload);
    });
  });

  describe("deleteSession", () => {
    it("deletes all session cookies", async () => {
      await deleteSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("fixit_session");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("fixit_session_exp");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("fixit_csrf");
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no session", async () => {
      mockCookieStore.get.mockReturnValue(null);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it("returns user from valid session", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      } as never);

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });
  });

  describe("requireAuth", () => {
    it("throws error when not authenticated", async () => {
      mockCookieStore.get.mockReturnValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("returns user when authenticated", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      } as never);

      const user = await requireAuth();

      expect(user).toEqual(mockUser);
    });
  });

  describe("requirePermission", () => {
    beforeEach(() => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      } as never);
    });

    it("throws Forbidden when user lacks permission", async () => {
      vi.mocked(hasPermission).mockReturnValue(false);

      await expect(requirePermission("admin:manage")).rejects.toThrow("Forbidden");
    });

    it("returns user when permission granted", async () => {
      vi.mocked(hasPermission).mockReturnValue(true);

      const user = await requirePermission("work_orders:read");

      expect(user).toEqual(mockUser);
    });
  });

  describe("requireAnyPermission", () => {
    beforeEach(() => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "csrf-token",
        },
      } as never);
    });

    it("throws Forbidden when user lacks all permissions", async () => {
      vi.mocked(hasAnyPermission).mockReturnValue(false);

      await expect(
        requireAnyPermission(["admin:manage", "users:manage"])
      ).rejects.toThrow("Forbidden");
    });

    it("returns user when any permission granted", async () => {
      vi.mocked(hasAnyPermission).mockReturnValue(true);

      const user = await requireAnyPermission(["work_orders:read", "admin:manage"]);

      expect(user).toEqual(mockUser);
    });
  });

  describe("verifyCsrfToken", () => {
    it("returns false when no session", async () => {
      mockCookieStore.get.mockReturnValue(null);

      const result = await verifyCsrfToken("some-token");

      expect(result).toBe(false);
    });

    it("returns false when token does not match", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      } as never);

      const result = await verifyCsrfToken("wrong-token");

      expect(result).toBe(false);
    });

    it("returns true when token matches", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      } as never);

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
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      } as never);

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "wrong-token" },
      });

      await expect(requireCsrf(request)).rejects.toThrow("CSRF token invalid");
    });

    it("passes when CSRF token is valid", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 100000,
          csrfToken: "correct-token",
        },
      } as never);

      const request = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "x-csrf-token": "correct-token" },
      });

      await expect(requireCsrf(request)).resolves.toBeUndefined();
    });
  });

  describe("refreshSessionIfNeeded", () => {
    it("does nothing when no session", async () => {
      mockCookieStore.get.mockReturnValue(null);

      await refreshSessionIfNeeded();

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("does not refresh when session has more than 1 hour left", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
          csrfToken: "csrf-token",
        },
      } as never);

      await refreshSessionIfNeeded();

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("refreshes session when less than 1 hour left", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          user: mockUser,
          expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
          csrfToken: "csrf-token",
        },
      } as never);

      await refreshSessionIfNeeded();

      expect(mockCookieStore.set).toHaveBeenCalled();
    });
  });
});

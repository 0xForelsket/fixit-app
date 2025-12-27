import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  getLegacyRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions";
import { describe, expect, it } from "vitest";

describe("Permissions", () => {
  describe("hasPermission", () => {
    it("should return true if user has the specific permission", () => {
      const userPermissions = [
        PERMISSIONS.TICKET_VIEW,
        PERMISSIONS.TICKET_CREATE,
      ];
      expect(hasPermission(userPermissions, PERMISSIONS.TICKET_VIEW)).toBe(
        true
      );
    });

    it("should return false if user lacks the permission", () => {
      const userPermissions = [PERMISSIONS.TICKET_VIEW];
      expect(hasPermission(userPermissions, PERMISSIONS.TICKET_CLOSE)).toBe(
        false
      );
    });

    it("should return true if user has ALL (*) permission", () => {
      const userPermissions = [PERMISSIONS.ALL];
      expect(hasPermission(userPermissions, PERMISSIONS.TICKET_CLOSE)).toBe(
        true
      );
    });

    it("should handle empty permissions", () => {
      expect(hasPermission([], PERMISSIONS.TICKET_VIEW)).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has at least one of the required permissions", () => {
      const userPermissions = [PERMISSIONS.TICKET_VIEW];
      const required = [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_CLOSE];
      expect(hasAnyPermission(userPermissions, required)).toBe(true);
    });

    it("should return false if user has none of the required permissions", () => {
      const userPermissions = [PERMISSIONS.TICKET_VIEW];
      const required = [PERMISSIONS.TICKET_CLOSE, PERMISSIONS.USER_CREATE];
      expect(hasAnyPermission(userPermissions, required)).toBe(false);
    });

    it("should return true if user has ALL (*) permission", () => {
      const userPermissions = [PERMISSIONS.ALL];
      const required = [PERMISSIONS.TICKET_CLOSE];
      expect(hasAnyPermission(userPermissions, required)).toBe(true);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if user has all required permissions", () => {
      const userPermissions = [
        PERMISSIONS.TICKET_VIEW,
        PERMISSIONS.TICKET_CREATE,
      ];
      const required = [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_CREATE];
      expect(hasAllPermissions(userPermissions, required)).toBe(true);
    });

    it("should return false if user is missing one required permission", () => {
      const userPermissions = [PERMISSIONS.TICKET_VIEW];
      const required = [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_CREATE];
      expect(hasAllPermissions(userPermissions, required)).toBe(false);
    });

    it("should return true if user has ALL (*) permission", () => {
      const userPermissions = [PERMISSIONS.ALL];
      const required = [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_CREATE];
      expect(hasAllPermissions(userPermissions, required)).toBe(true);
    });
  });

  describe("getLegacyRolePermissions", () => {
    it("should return correct permissions for admin", () => {
      const perms = getLegacyRolePermissions("admin");
      expect(perms).toEqual(DEFAULT_ROLE_PERMISSIONS.admin);
      expect(perms).toContain(PERMISSIONS.ALL);
    });

    it("should return correct permissions for tech", () => {
      const perms = getLegacyRolePermissions("tech");
      expect(perms).toEqual(DEFAULT_ROLE_PERMISSIONS.tech);
      expect(perms).toContain(PERMISSIONS.TICKET_RESOLVE);
    });

    it("should return correct permissions for operator", () => {
      const perms = getLegacyRolePermissions("operator");
      expect(perms).toEqual(DEFAULT_ROLE_PERMISSIONS.operator);
      expect(perms).toContain(PERMISSIONS.TICKET_CREATE);
      expect(perms).not.toContain(PERMISSIONS.TICKET_RESOLVE);
    });
  });
});

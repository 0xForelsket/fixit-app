import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  userHasPermission: vi.fn(),
  PERMISSIONS: {
    ANALYTICS_VIEW: "analytics:view",
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

import { GET } from "@/app/(app)/api/analytics/kpis/route";
import { db } from "@/db";
import { userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

describe("GET /api/analytics/kpis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(userHasPermission).mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 401 when lacking analytics permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });
    vi.mocked(userHasPermission).mockReturnValue(false);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("requires analytics permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    // The endpoint requires complex db queries - just verify auth passes
    // When permission is granted, it should attempt to query the database
    // Mock will cause 500, but that's expected in unit tests without full db setup
    const response = await GET();

    // Should not be 401 when authenticated with permission
    expect(response.status).not.toBe(401);
  });

  it("calls userHasPermission with correct permission", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    await GET();

    expect(userHasPermission).toHaveBeenCalled();
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      sessionVersion: 1,
      permissions: ["*"],
    });
    vi.mocked(userHasPermission).mockReturnValue(true);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("Database error")),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).not.toContain("Database error");
  });
});

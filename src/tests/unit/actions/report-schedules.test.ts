import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentUser,
  mockUserHasPermission,
  mockFindMany,
  mockFindFirst,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockUserHasPermission: vi.fn(),
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      reportSchedules: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    REPORTS_VIEW: "reports:view",
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  validateEmails: vi.fn(() => ({ valid: [], invalid: [] })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { getSchedule, getSchedulesForTemplate } = await import(
  "@/actions/report-schedules"
);

describe("report-schedules actions", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockUserHasPermission.mockReset();
    mockFindMany.mockReset();
    mockFindFirst.mockReset();

    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      permissions: ["reports:view"],
      sessionVersion: 1,
    });
    mockUserHasPermission.mockReturnValue(true);
  });

  it("blocks schedule list reads without reports:view", async () => {
    mockUserHasPermission.mockReturnValue(false);

    const result = await getSchedulesForTemplate("template-1");

    expect(result).toEqual({
      success: false,
      error: "You don't have permission to view schedules",
    });
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns schedules for authorized users", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "schedule-1",
        templateId: "template-1",
      },
    ]);

    const result = await getSchedulesForTemplate("template-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([
        {
          id: "schedule-1",
          templateId: "template-1",
        },
      ]);
    }
  });

  it("blocks single schedule reads without reports:view", async () => {
    mockUserHasPermission.mockReturnValue(false);

    const result = await getSchedule("schedule-1");

    expect(result).toEqual({
      success: false,
      error: "You don't have permission to view schedules",
    });
    expect(mockFindFirst).not.toHaveBeenCalled();
  });

  it("returns a single schedule for authorized users", async () => {
    mockFindFirst.mockResolvedValue({
      id: "schedule-1",
      templateId: "template-1",
    });

    const result = await getSchedule("schedule-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        id: "schedule-1",
        templateId: "template-1",
      });
    }
  });
});

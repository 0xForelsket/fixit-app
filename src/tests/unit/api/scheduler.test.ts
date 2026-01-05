import { afterEach, beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockSelectFrom = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelect = vi.fn(() => ({
  from: mockSelectFrom.mockReturnValue({
    where: mockSelectWhere,
  }),
}));

const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    returning: mockInsertReturning,
  }),
}));

const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere,
  }),
}));

const mockUsersFindMany = vi.fn();
const mockUsersFindFirst = vi.fn();
const mockRolesFindFirst = vi.fn();
const mockEquipmentFindFirst = vi.fn();

const mockTransaction = vi.fn();

const mockGetCurrentUser = vi.fn();
const mockRequireCsrf = vi.fn().mockResolvedValue(true);

const mockApiLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockSchedulerLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "test-request-id");

const mockCreateNotification = vi.fn().mockResolvedValue(true);

// Mock modules
vi.vi.fn("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    query: {
      users: {
        findMany: mockUsersFindMany,
        findFirst: mockUsersFindFirst,
      },
      roles: {
        findFirst: mockRolesFindFirst,
      },
      equipment: {
        findFirst: mockEquipmentFindFirst,
      },
    },
    transaction: mockTransaction,
  },
}));

vi.vi.fn("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
  requireCsrf: mockRequireCsrf,
}));

vi.vi.fn("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  schedulerLogger: mockSchedulerLogger,
  generateRequestId: mockGenerateRequestId,
}));

vi.vi.fn("@/lib/notifications", () => ({
  createNotification: mockCreateNotification,
}));

// Dynamic imports after mock.module
const { POST } = await import("@/app/(app)/api/scheduler/run/route");

describe("POST /api/scheduler/run", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockSelectWhere.mockClear();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockClear();
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
    mockUsersFindMany.mockClear();
    mockUsersFindFirst.mockClear();
    mockRolesFindFirst.mockClear();
    mockEquipmentFindFirst.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
    mockRequireCsrf.mockClear();
    mockApiLogger.error.mockClear();
    mockApiLogger.warn.mockClear();
    mockApiLogger.info.mockClear();
    mockSchedulerLogger.error.mockClear();
    mockSchedulerLogger.warn.mockClear();
    mockSchedulerLogger.info.mockClear();
    mockGenerateRequestId.mockClear();
    mockCreateNotification.mockClear();

    // Reset chains
    mockSelect.mockReturnValue({
      from: mockSelectFrom.mockReturnValue({
        where: mockSelectWhere.mockResolvedValue([]),
      }),
    });
    mockInsert.mockReturnValue({
      values: mockInsertValues.mockReturnValue({
        returning: mockInsertReturning,
      }),
    });
    mockUpdate.mockReturnValue({
      set: mockUpdateSet.mockReturnValue({
        where: mockUpdateWhere,
      }),
    });

    // Reset env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when not authenticated and no cron secret", async () => {
    process.env.CRON_SECRET = undefined;
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("authorizes with valid cron secret", async () => {
    process.env.CRON_SECRET = "test-secret";

    // Mock no pending schedules and no work orders to escalate
    mockSelectWhere.mockResolvedValue([]);
    mockRolesFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.message).toBe("Scheduler run complete");
    expect(data.data.generated).toBe(0);
    expect(data.data.escalated).toBe(0);
  });

  it("authorizes with user having scheduler permission", async () => {
    process.env.CRON_SECRET = undefined;
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      departmentId: "1",
      sessionVersion: 1,
      permissions: ["system:scheduler"],
      hourlyRate: 50.0,
    });

    mockSelectWhere.mockResolvedValue([]);
    mockRolesFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.generated).toBe(0);
  });

  it("authorizes with wildcard permission", async () => {
    process.env.CRON_SECRET = undefined;
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      departmentId: "1",
      sessionVersion: 1,
      permissions: ["*"],
      hourlyRate: 50.0,
    });

    mockSelectWhere.mockResolvedValue([]);
    mockRolesFindFirst.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("rejects user without scheduler permission", async () => {
    process.env.CRON_SECRET = ""; // Empty string
    mockGetCurrentUser.mockResolvedValue({
      id: "1", displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      departmentId: "1",
      sessionVersion: 1,
      permissions: ["ticket:view", "equipment:view"],
      hourlyRate: 25.0,
    });

    // Reset db mock to not return any schedules
    mockSelectWhere.mockResolvedValue([]);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    // The tech user doesn't have system:scheduler permission, so should be unauthorized
    expect(response.status).toBe(401);
  });

  it("processes pending schedules and generates work orders", async () => {
    process.env.CRON_SECRET = "test-secret";

    const mockSchedule = {
      id: "1", displayId: 1,
      equipmentId: "1",
      title: "Monthly Maintenance",
      type: "preventive" as const,
      frequencyDays: 30,
      lastGenerated: null,
      nextDue: new Date(Date.now() - 1000), // Due in the past
      isActive: true,
      createdAt: new Date(),
    };

    // First call returns schedules, second call returns no work orders to escalate
    let selectCallCount = 0;
    mockSelectWhere.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([mockSchedule]);
      }
      return Promise.resolve([]); // No work orders to escalate
    });

    mockRolesFindFirst.mockResolvedValue(undefined);

    // Mock the transaction
    mockTransaction.mockImplementation(async (callback: any) => {
      const tx = {
        query: {
          users: {
            findMany: vi.fn(() => Promise.resolve([{ id: "1", displayId: 1, assignedRole: { name: "admin" } }])),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([{ id: "1", displayId: 1 }])),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
          })),
        })),
      };
      return callback(tx as any);
    });

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.message).toBe("Scheduler run complete");
    expect(data.data.generated).toBe(1);
  });

  it("handles errors during schedule processing", async () => {
    process.env.CRON_SECRET = "test-secret";

    const mockSchedule = {
      id: "1", displayId: 1,
      equipmentId: "1",
      title: "Maintenance",
      type: "preventive" as const,
      frequencyDays: 7,
      lastGenerated: null,
      nextDue: new Date(Date.now() - 1000),
      isActive: true,
      createdAt: new Date(),
    };

    let selectCallCount = 0;
    mockSelectWhere.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([mockSchedule]);
      }
      return Promise.resolve([]);
    });

    mockRolesFindFirst.mockResolvedValue(undefined);
    mockTransaction.mockRejectedValue(
      new Error("Transaction failed")
    );

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.generated).toBe(0);
    expect(data.data.errors).toHaveLength(1);
  });

  describe("Escalation", () => {
    it("escalates overdue work orders and notifies admins", async () => {
      process.env.CRON_SECRET = "test-secret";

      const overdueWorkOrder = {
        id: "1", displayId: 1,
        equipmentId: "10",
        title: "Fix Machine A",
        status: "open",
        dueBy: new Date(Date.now() - 3600000), // 1 hour ago
        escalatedAt: null,
        assignedToId: "5",
      };

      let selectCallCount = 0;
      mockSelectWhere.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([]); // No schedules
        }
        return Promise.resolve([overdueWorkOrder]); // Overdue work order
      });

      // Mock admin role and users
      mockRolesFindFirst.mockResolvedValue({
        id: "1", displayId: 1,
        name: "admin",
      } as any);
      mockUsersFindMany.mockResolvedValue([
        { id: "2", displayId: 2, name: "Admin User" },
      ] as any[]);
      mockEquipmentFindFirst.mockResolvedValue({
        id: "10", displayId: 10,
        name: "Machine A",
      } as any);

      const request = new Request("http://localhost/api/scheduler/run", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.escalated).toBe(1);

      // Should update work order with escalatedAt
      expect(mockUpdate).toHaveBeenCalled();

      // Should notify admin and assigned technician
      expect(mockCreateNotification).toHaveBeenCalledTimes(2);
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "2", // Admin
          type: "work_order_escalated",
          title: "Work Order Escalated - SLA Breached",
        })
      );
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "5", // Assigned tech
          type: "work_order_escalated",
          title: "Your Work Order Has Been Escalated",
        })
      );
    });

    it("does not escalate work orders that are already escalated", async () => {
      process.env.CRON_SECRET = "test-secret";

      // Work order with escalatedAt already set should not be returned
      // because the query filters for isNull(escalatedAt)
      mockSelectWhere.mockResolvedValue([]);

      mockRolesFindFirst.mockResolvedValue(undefined);

      const request = new Request("http://localhost/api/scheduler/run", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.escalated).toBe(0);
      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it("escalates work order without assigned tech (admin only notification)", async () => {
      process.env.CRON_SECRET = "test-secret";

      const unassignedOverdueWorkOrder = {
        id: "2", displayId: 2,
        equipmentId: "10",
        title: "Unassigned Work Order",
        status: "open",
        dueBy: new Date(Date.now() - 3600000),
        escalatedAt: null,
        assignedToId: null, // No assignee
      };

      let selectCallCount = 0;
      mockSelectWhere.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([]);
        }
        return Promise.resolve([unassignedOverdueWorkOrder]);
      });

      mockRolesFindFirst.mockResolvedValue({
        id: "1", displayId: 1,
        name: "admin",
      } as any);
      mockUsersFindMany.mockResolvedValue([
        { id: "2", displayId: 2, name: "Admin 1" },
        { id: "3", displayId: 3, name: "Admin 2" },
      ] as any[]);
      mockEquipmentFindFirst.mockResolvedValue({
        id: "10", displayId: 10,
        name: "Equipment X",
      } as any);

      const request = new Request("http://localhost/api/scheduler/run", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.escalated).toBe(1);

      // Should notify both admins but no tech (no assignee)
      expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    });

    it("handles escalation errors gracefully", async () => {
      process.env.CRON_SECRET = "test-secret";

      const overdueWorkOrder = {
        id: "1", displayId: 1,
        equipmentId: "10",
        title: "Problematic Work Order",
        status: "in_progress",
        dueBy: new Date(Date.now() - 3600000),
        escalatedAt: null,
        assignedToId: "5",
      };

      let selectCallCount = 0;
      mockSelectWhere.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([]);
        }
        return Promise.resolve([overdueWorkOrder]);
      });

      mockRolesFindFirst.mockResolvedValue({
        id: "1", displayId: 1,
        name: "admin",
      } as any);
      mockUsersFindMany.mockResolvedValue([] as any[]);

      // Make update fail
      mockUpdateWhere.mockRejectedValue(new Error("Update failed"));

      const request = new Request("http://localhost/api/scheduler/run", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.escalated).toBe(0);
      expect(data.data.errors).toHaveLength(1);
      expect(data.data.errors[0]).toContain("Escalation WO 1");
    });
  });
});

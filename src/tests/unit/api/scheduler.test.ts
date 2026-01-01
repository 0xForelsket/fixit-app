import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    query: {
      users: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      roles: {
        findFirst: vi.fn(),
      },
      equipment: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(),
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  schedulerLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  generateRequestId: vi.fn(() => "test-request-id"),
}));

// Mock notifications helper
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(true),
}));

import { POST } from "@/app/(app)/api/scheduler/run/route";
import { db } from "@/db";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

describe("POST /api/scheduler/run", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when not authenticated and no cron secret", async () => {
    process.env.CRON_SECRET = undefined;
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("authorizes with valid cron secret", async () => {
    process.env.CRON_SECRET = "test-secret";

    // Mock no pending schedules and no work orders to escalate
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      departmentId: 1,
      sessionVersion: 1, permissions: ["system:scheduler"],
      hourlyRate: 50.0,
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);

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
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      departmentId: 1,
      sessionVersion: 1, permissions: ["*"],
      hourlyRate: 50.0,
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("rejects user without scheduler permission", async () => {
    process.env.CRON_SECRET = ""; // Empty string
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      departmentId: 1,
      sessionVersion: 1, permissions: ["ticket:view", "equipment:view"],
      hourlyRate: 25.0,
    });

    // Reset db mock to not return any schedules
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

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
      id: 1,
      equipmentId: 1,
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
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            return Promise.resolve([mockSchedule]);
          }
          return Promise.resolve([]); // No work orders to escalate
        }),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);

    // Mock the transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const tx = {
        query: {
          users: {
            findMany: vi
              .fn()
              .mockResolvedValue([{ id: 1, assignedRole: { name: "admin" } }]),
          },
        },
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(),
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
      id: 1,
      equipmentId: 1,
      title: "Maintenance",
      type: "preventive" as const,
      frequencyDays: 7,
      lastGenerated: null,
      nextDue: new Date(Date.now() - 1000),
      isActive: true,
      createdAt: new Date(),
    };

    let selectCallCount = 0;
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            return Promise.resolve([mockSchedule]);
          }
          return Promise.resolve([]);
        }),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);
    vi.mocked(db.transaction).mockRejectedValue(
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
        id: 1,
        equipmentId: 10,
        title: "Fix Machine A",
        status: "open",
        dueBy: new Date(Date.now() - 3600000), // 1 hour ago
        escalatedAt: null,
        assignedToId: 5,
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve([]); // No schedules
            }
            return Promise.resolve([overdueWorkOrder]); // Overdue work order
          }),
        })),
      } as unknown as ReturnType<typeof db.select>);

      // Mock admin role and users
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
        name: "admin",
      });
      vi.mocked(db.query.users.findMany).mockResolvedValue([
        { id: 2, name: "Admin User" },
      ]);
      vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
        id: 10,
        name: "Machine A",
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
      expect(data.data.escalated).toBe(1);

      // Should update work order with escalatedAt
      expect(db.update).toHaveBeenCalled();

      // Should notify admin and assigned technician
      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2, // Admin
          type: "work_order_escalated",
          title: "Work Order Escalated - SLA Breached",
        })
      );
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5, // Assigned tech
          type: "work_order_escalated",
          title: "Your Work Order Has Been Escalated",
        })
      );
    });

    it("does not escalate work orders that are already escalated", async () => {
      process.env.CRON_SECRET = "test-secret";

      // Work order with escalatedAt already set should not be returned
      // because the query filters for isNull(escalatedAt)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.query.roles.findFirst).mockResolvedValue(null);

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
      expect(createNotification).not.toHaveBeenCalled();
    });

    it("escalates work order without assigned tech (admin only notification)", async () => {
      process.env.CRON_SECRET = "test-secret";

      const unassignedOverdueWorkOrder = {
        id: 2,
        equipmentId: 10,
        title: "Unassigned Work Order",
        status: "open",
        dueBy: new Date(Date.now() - 3600000),
        escalatedAt: null,
        assignedToId: null, // No assignee
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve([]);
            }
            return Promise.resolve([unassignedOverdueWorkOrder]);
          }),
        })),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
        name: "admin",
      });
      vi.mocked(db.query.users.findMany).mockResolvedValue([
        { id: 2, name: "Admin 1" },
        { id: 3, name: "Admin 2" },
      ]);
      vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
        id: 10,
        name: "Equipment X",
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
      expect(data.data.escalated).toBe(1);

      // Should notify both admins but no tech (no assignee)
      expect(createNotification).toHaveBeenCalledTimes(2);
    });

    it("handles escalation errors gracefully", async () => {
      process.env.CRON_SECRET = "test-secret";

      const overdueWorkOrder = {
        id: 1,
        equipmentId: 10,
        title: "Problematic Work Order",
        status: "in_progress",
        dueBy: new Date(Date.now() - 3600000),
        escalatedAt: null,
        assignedToId: 5,
      };

      let selectCallCount = 0;
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve([]);
            }
            return Promise.resolve([overdueWorkOrder]);
          }),
        })),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 1,
        name: "admin",
      });
      vi.mocked(db.query.users.findMany).mockResolvedValue([]);

      // Make update fail
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn().mockRejectedValue(new Error("Update failed")),
        })),
      } as unknown as ReturnType<typeof db.update>);

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

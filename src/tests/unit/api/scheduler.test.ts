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

import { POST } from "@/app/(app)/api/scheduler/run/route";
import { db } from "@/db";
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
    delete process.env.CRON_SECRET;
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("authorizes with valid cron secret", async () => {
    process.env.CRON_SECRET = "test-secret";

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]), // No pending schedules
      })),
    } as unknown as ReturnType<typeof db.select>);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-secret",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.message).toBe("No schedules due");
    expect(data.data.generated).toBe(0);
  });

  it("authorizes with user having scheduler permission", async () => {
    delete process.env.CRON_SECRET;
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["system:scheduler"], // Has scheduler permission
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    const request = new Request("http://localhost/api/scheduler/run", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.generated).toBe(0);
  });

  it("authorizes with wildcard permission", async () => {
    delete process.env.CRON_SECRET;
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: ["*"], // Wildcard permission
    });

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as ReturnType<typeof db.select>);

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
      permissions: DEFAULT_ROLE_PERMISSIONS.tech, // No scheduler permission
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
      type: "maintenance",
      frequencyDays: 30,
      nextDue: new Date(Date.now() - 1000), // Due in the past
      isActive: true,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([mockSchedule]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    // Mock the transaction
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const tx = {
        query: {
          users: {
            findMany: vi.fn().mockResolvedValue([
              { id: 1, assignedRole: { name: "admin" } },
            ]),
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
      return callback(tx as unknown as typeof db);
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
      type: "maintenance",
      frequencyDays: 7,
      nextDue: new Date(Date.now() - 1000),
      isActive: true,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([mockSchedule]),
      })),
    } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.transaction).mockRejectedValue(new Error("Transaction failed"));

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
});

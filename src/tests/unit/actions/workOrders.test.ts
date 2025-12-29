import {
  addWorkOrderComment,
  createWorkOrder,
  resolveWorkOrder,
  updateWorkOrder,
} from "@/actions/workOrders";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: {
        findFirst: vi.fn(),
      },
      users: {
        findMany: vi.fn(),
      },
      workOrders: {
        findFirst: vi.fn(),
      },
      roles: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) => {
      // Call the callback with a mock transaction object
      const mockTx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(),
          })),
        })),
      };
      return callback(mockTx);
    }),
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
  },
}));

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

describe("createWorkOrder action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("equipmentId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Test work order");
    formData.set("description", "Test description");

    const result = await createWorkOrder(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in to create a work order");
    }
  });

  it("should return error for invalid input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const formData = new FormData();
    formData.set("equipmentId", "invalid"); // not a number
    formData.set("type", "breakdown");
    formData.set("title", "");
    formData.set("description", "Test");

    const result = await createWorkOrder(undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("should create work order successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const mockWorkOrder = {
      id: 1,
      equipmentId: 1,
      type: "breakdown",
      title: "Equipment stopped",
      description: "Equipment won't start",
      priority: "high",
      status: "open",
      reportedById: 1,
      dueBy: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const mockTx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockWorkOrder]),
          })),
        })),
      };
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockWorkOrder]),
      })),
    } as unknown);

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.query.users.findMany).mockResolvedValue([]);

    const formData = new FormData();
    formData.set("equipmentId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Equipment stopped");
    formData.set("description", "Equipment won't start");
    formData.set("priority", "high");

    const result = await createWorkOrder(undefined, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockWorkOrder);
    }
  });

  it("should notify techs for critical priority work orders", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const mockWorkOrder = {
      id: 1,
      equipmentId: 1,
      type: "breakdown",
      title: "Critical issue",
      description: "Urgent",
      priority: "critical",
      status: "open",
      reportedById: 1,
      dueBy: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      const mockTx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockWorkOrder]),
          })),
        })),
      };
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    const mockInsert = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockWorkOrder]),
      })),
    }));

    vi.mocked(db.insert as unknown as typeof mockInsert).mockImplementation(
      mockInsert
    );

    vi.mocked(db.query.equipment.findFirst).mockResolvedValue({
      id: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: 1,
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock the tech role lookup - this is required for notification logic
    vi.mocked(db.query.roles.findFirst).mockResolvedValue({
      id: 2,
      name: "tech",
      description: "Maintenance technician",
      permissions: ["ticket:view", "ticket:update"],
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.query.users.findMany).mockResolvedValue([
      {
        id: 2,
        employeeId: "TECH-001",
        name: "Tech User",
        pin: "hashed",
        roleId: 2,
        isActive: true,
        hourlyRate: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const formData = new FormData();
    formData.set("equipmentId", "1");
    formData.set("type", "breakdown");
    formData.set("title", "Critical issue");
    formData.set("description", "Urgent");
    formData.set("priority", "critical");

    await createWorkOrder(undefined, formData);

    // Should have called insert for notifications (via mockInsert)
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("updateWorkOrder action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should reject updates from operators", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "You don't have permission to update work orders"
      );
    }
  });

  it("should return error for non-existent work order", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.workOrders.findFirst).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder(999, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Work order not found");
    }
  });

  it("should update work order status successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
      id: 1,
      equipmentId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: 2,
      assignedToId: null,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder(1, undefined, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });

  it("should allow admin to update work orders", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: 3,
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
      id: 1,
      equipmentId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: 2,
      assignedToId: null,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("priority", "high");

    const result = await updateWorkOrder(1, undefined, formData);

    expect(result.success).toBe(true);
  });
});

describe("resolveWorkOrder action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveWorkOrder(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should reject resolution from operators", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveWorkOrder(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "You don't have permission to resolve work orders"
      );
    }
  });

  it("should require resolution notes", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    const formData = new FormData();
    // No resolution notes

    const result = await resolveWorkOrder(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Resolution notes are required");
    }
  });

  it("should resolve work order successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: 2,
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
      id: 1,
      equipmentId: 1,
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "in_progress",
      reportedById: 2,
      assignedToId: 1,
      dueBy: new Date(),
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.update as unknown as () => unknown).mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    } as unknown);

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("resolutionNotes", "Replaced the faulty component.");

    const result = await resolveWorkOrder(1, undefined, formData);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled(); // For status change log
  });
});

describe("addWorkOrderComment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error when not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("comment", "Test comment");

    const result = await addWorkOrderComment(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should require comment content", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    const formData = new FormData();
    formData.set("comment", "   "); // Only whitespace

    const result = await addWorkOrderComment(1, undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Comment is required");
    }
  });

  it("should add comment successfully", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn(),
    } as unknown);

    const formData = new FormData();
    formData.set("comment", "Additional details about the issue");

    const result = await addWorkOrderComment(1, undefined, formData);

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("should trim comment whitespace", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: 1,
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
    });

    let capturedValues: unknown;
    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn((val) => {
        capturedValues = val;
      }),
    } as unknown);

    const formData = new FormData();
    formData.set("comment", "  Trimmed comment  ");

    await addWorkOrderComment(1, undefined, formData);

    expect((capturedValues as Record<string, unknown>).newValue).toBe(
      "Trimmed comment"
    );
  });
});

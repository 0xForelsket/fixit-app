import {
  addWorkOrderComment,
  createWorkOrder,
  resolveWorkOrder,
  updateWorkOrder,
} from "@/actions/workOrders";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the notifications helper
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(true),
}));

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
import { createNotification } from "@/lib/notifications";
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      departmentId: null,
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
      departmentId: null,
      parentId: null,
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
      sessionVersion: 1,
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
      departmentId: null,
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
      departmentId: null,
      parentId: null,
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
        departmentId: null,
        preferences: null,
        sessionVersion: 1,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      departmentId: null,
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
      sessionVersion: 1,
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
      departmentId: null,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      departmentId: null,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
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
      sessionVersion: 1,
    });

    let capturedValues: unknown;
    vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
      values: vi.fn((val) => {
        capturedValues = val;
      }),
    } as unknown);

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
      departmentId: null,
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.set("comment", "  Trimmed comment  ");

    await addWorkOrderComment(1, undefined, formData);

    expect((capturedValues as Record<string, unknown>).newValue).toBe(
      "Trimmed comment"
    );
  });
});

describe("Notification triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateWorkOrder notifications", () => {
    it("should notify reporter on status change", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: 2, // Different from current user
        assignedToId: 1,
        dueBy: new Date(),
        departmentId: null,
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

      await updateWorkOrder(1, undefined, formData);

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2, // Reporter
          type: "work_order_status_changed",
          title: expect.stringContaining("IN PROGRESS"),
        })
      );
    });

    it("should not notify reporter if they made the change", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 2, // Same as reporter
        employeeId: "TECH-002",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: 2, // Same as current user
        assignedToId: null,
        dueBy: new Date(),
        departmentId: null,
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

      await updateWorkOrder(1, undefined, formData);

      // Should not notify because reporter made the change themselves
      expect(createNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "work_order_status_changed",
        })
      );
    });
  });

  describe("resolveWorkOrder notifications", () => {
    it("should notify reporter when work order is resolved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: 2, // Different from current user
        assignedToId: 1,
        dueBy: new Date(),
        departmentId: null,
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
      formData.set("resolutionNotes", "Fixed the issue");

      await resolveWorkOrder(1, undefined, formData);

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2, // Reporter
          type: "work_order_resolved",
          title: "Your Work Order Has Been Resolved",
        })
      );
    });

    it("should not notify reporter if they resolved it themselves", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 2, // Same as reporter
        employeeId: "TECH-002",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: 2, // Same as current user
        assignedToId: 2,
        dueBy: new Date(),
        departmentId: null,
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
      formData.set("resolutionNotes", "Fixed the issue myself");

      await resolveWorkOrder(1, undefined, formData);

      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  describe("addWorkOrderComment notifications", () => {
    it("should notify reporter and assignee when comment is added", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 3, // A different user
        employeeId: "ADMIN-001",
        name: "Admin",
        roleName: "admin",
        roleId: 1,
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: 1, // Different from commenter
        assignedToId: 2, // Different from commenter
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
        values: vi.fn(),
      } as unknown);

      const formData = new FormData();
      formData.set("comment", "This is a comment");

      await addWorkOrderComment(1, undefined, formData);

      // Should notify both reporter and assignee
      expect(createNotification).toHaveBeenCalledTimes(2);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1, // Reporter
          type: "work_order_commented",
        })
      );
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2, // Assignee
          type: "work_order_commented",
        })
      );
    });

    it("should not notify commenter if they are reporter or assignee", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 1, // Same as reporter
        employeeId: "OP-001",
        name: "Operator",
        roleName: "operator",
        roleId: 1,
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: 1, // Same as commenter
        assignedToId: 2, // Different from commenter
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
        values: vi.fn(),
      } as unknown);

      const formData = new FormData();
      formData.set("comment", "Adding my own comment");

      await addWorkOrderComment(1, undefined, formData);

      // Should only notify assignee, not reporter (who is the commenter)
      expect(createNotification).toHaveBeenCalledTimes(1);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2, // Assignee only
          type: "work_order_commented",
        })
      );
    });

    it("should not send duplicate notification if reporter is assignee", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 3, // Different user
        employeeId: "ADMIN-001",
        name: "Admin",
        roleName: "admin",
        roleId: 1,
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: 1,
        assignedToId: 1, // Same as reporter
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
        values: vi.fn(),
      } as unknown);

      const formData = new FormData();
      formData.set("comment", "Comment from admin");

      await addWorkOrderComment(1, undefined, formData);

      // Should only send one notification (reporter = assignee)
      expect(createNotification).toHaveBeenCalledTimes(1);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: "work_order_commented",
        })
      );
    });

    it("should not notify when work order has no assignee", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 2, // Different from reporter
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: 2,
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      vi.mocked(db.query.workOrders.findFirst).mockResolvedValue({
        id: 1,
        equipmentId: 1,
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: 1,
        assignedToId: null, // No assignee
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.insert as unknown as () => unknown).mockReturnValue({
        values: vi.fn(),
      } as unknown);

      const formData = new FormData();
      formData.set("comment", "Comment on unassigned work order");

      await addWorkOrderComment(1, undefined, formData);

      // Should only notify reporter
      expect(createNotification).toHaveBeenCalledTimes(1);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1, // Reporter only
          type: "work_order_commented",
        })
      );
    });
  });
});

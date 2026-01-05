// Actions will be imported dynamically after mocks
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS as PERMISSIONS_SOURCE,
} from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateNotification = vi.fn().mockResolvedValue(true);

// Mock the notifications helper
vi.mock("@/lib/notifications", () => ({
  createNotification: mockCreateNotification,
}));

const mockFindFirstEquipment = vi.fn();
const mockFindManyUsers = vi.fn();
const mockFindFirstWorkOrder = vi.fn();
const mockFindFirstRole = vi.fn();

const mockInsert = vi.fn(() => ({
  values: vi.fn(() => ({
    returning: vi.fn(),
  })),
}));

const mockUpdate = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn(),
  })),
}));

const mockDelete = vi.fn(() => ({
  where: vi.fn(),
}));

const mockTxInsert = vi.fn((table: unknown) => ({
  values: vi.fn(() => Promise.resolve()),
}));

const mockTxUpdate = vi.fn((table: unknown) => ({
  set: vi.fn(() => ({
    where: vi.fn(() => Promise.resolve()),
  })),
}));

const mockTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) => {
    // Call the callback with a mock transaction object
    const mockTx = {
      insert: mockTxInsert,
      values: vi.fn(() => ({ returning: vi.fn() })), // Ensure transaction usage matches
      update: mockTxUpdate,
      delete: mockDelete,
      query: {
        equipment: { findFirst: mockFindFirstEquipment },
        users: { findMany: mockFindManyUsers },
        workOrders: { findFirst: mockFindFirstWorkOrder },
        roles: { findFirst: mockFindFirstRole },
      },
    };
    return await callback(mockTx);
  }
);

// Mock auth to prevent leakage
vi.mock("@/lib/auth", () => ({
  hasPermission: vi.fn((userPermissions: string[], required: string) => {
    if (userPermissions.includes("*")) return true;
    return userPermissions.includes(required);
  }),
  userHasPermission: vi.fn((user, permission) => {
    if (user?.permissions?.includes("*")) return true;
    return user?.permissions?.includes(permission);
  }),
  PERMISSIONS: PERMISSIONS_SOURCE,
}));

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: {
        findFirst: mockFindFirstEquipment,
      },
      users: {
        findMany: mockFindManyUsers,
      },
      workOrders: {
        findFirst: mockFindFirstWorkOrder,
      },
      roles: {
        findFirst: mockFindFirstRole,
      },
    },
    transaction: mockTransaction,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete, // Add delete
  },
}));

const mockGetCurrentUser = vi.fn();

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock audit
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  workOrderLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import actions dynamically
const {
  addWorkOrderComment,
  createWorkOrder,
  resolveWorkOrder,
  updateWorkOrder,
} = await import("@/actions/workOrders");

describe("createWorkOrder action", () => {
  beforeEach(() => {
    mockCreateNotification.mockClear();
    mockFindFirstEquipment.mockClear();
    mockFindManyUsers.mockClear();
    mockFindFirstWorkOrder.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("equipmentId", ""); // empty string (invalid)
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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const mockWorkOrder = {
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Equipment stopped",
      description: "Equipment won't start",
      priority: "high",
      status: "open",
      reportedById: "1",
      dueBy: new Date(),
      departmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTransaction.mockImplementation(async (callback) => {
      const mockTx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockWorkOrder]),
          })),
        })),
        query: {
          roles: {
            findFirst: mockFindFirstRole, // Ensure roles.findFirst is available in transaction
          },
          equipment: {
            findFirst: mockFindFirstEquipment,
          },
        },
      };
      // We need to ensure db.insert inside transaction behaves correctly.
      // The original code mocked db.insert globally. The action likely uses tx.insert or db.insert.
      // If it uses tx.insert, our mockTx covers it.
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    mockInsert.mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockWorkOrder]),
      })),
    });

    mockFindFirstEquipment.mockResolvedValue({
      id: "1",
      displayId: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: "1",
      status: "operational",
      ownerId: null,
      typeId: null,
      modelId: null,
      departmentId: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockFindManyUsers.mockResolvedValue([]);

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
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const mockWorkOrder = {
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Critical issue",
      description: "Urgent",
      priority: "critical",
      status: "open",
      reportedById: "1",
      dueBy: new Date(),
      departmentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTxInsert = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockWorkOrder]),
      })),
    }));

    mockTransaction.mockImplementation(async (callback) => {
      const mockTx = {
        insert: mockTxInsert,
        query: {
          roles: {
            findFirst: mockFindFirstRole,
          },
          users: {
            findMany: mockFindManyUsers,
          },
        },
      };
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    // Also verify mockInsert is called if the code falls back to db.insert or if that's what we want to test
    mockInsert.mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([mockWorkOrder]),
      })),
    }));

    mockFindFirstEquipment.mockResolvedValue({
      id: "1",
      displayId: 1,
      name: "Test Equipment",
      code: "TM-001",
      locationId: "1",
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
    mockFindFirstRole.mockResolvedValue({
      id: "2",
      displayId: 2,
      name: "tech",
      description: "Maintenance technician",
      permissions: ["ticket:view", "ticket:update"],
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockFindManyUsers.mockResolvedValue([
      {
        id: "2",
        displayId: 2,
        employeeId: "TECH-001",
        name: "Tech User",
        pin: "hashed",
        roleId: "2",
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

    // Should have called insert for notifications
    expect(mockTxInsert).toHaveBeenCalled();
  });
});

describe("updateWorkOrder action", () => {
  beforeEach(() => {
    mockCreateNotification.mockClear();
    mockFindFirstEquipment.mockClear();
    mockFindManyUsers.mockClear();
    mockFindFirstWorkOrder.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should reject updates from operators", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "You don't have permission to update work orders"
      );
    }
  });

  it("should return error for non-existent work order", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindFirstWorkOrder.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder("999", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Work order not found");
    }
  });

  it("should update work order status successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindFirstWorkOrder.mockResolvedValue({
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: "2",
      assignedToId: null,
      dueBy: new Date(),
      departmentId: null,
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate.mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    });

    mockInsert.mockReturnValue({
      values: vi.fn(),
    });

    const formData = new FormData();
    formData.set("status", "in_progress");

    const result = await updateWorkOrder("1", undefined, formData);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled(); // For status change log
  });

  it("should allow admin to update work orders", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "ADMIN-001",
      name: "Admin",
      roleName: "admin",
      roleId: "3",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      sessionVersion: 1,
    });

    mockFindFirstWorkOrder.mockResolvedValue({
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: "2",
      assignedToId: null,
      dueBy: new Date(),
      departmentId: null,
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate.mockReturnValue({
      set: vi.fn(() => ({ where: vi.fn() })),
    });

    mockInsert.mockReturnValue({
      values: vi.fn(),
    });

    const formData = new FormData();
    formData.set("priority", "high");

    const result = await updateWorkOrder("1", undefined, formData);

    expect(result.success).toBe(true);
  });
});

describe("resolveWorkOrder action", () => {
  beforeEach(() => {
    mockCreateNotification.mockClear();
    mockFindFirstEquipment.mockClear();
    mockFindManyUsers.mockClear();
    mockFindFirstWorkOrder.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveWorkOrder("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should reject resolution from operators", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("resolutionNotes", "Fixed it");

    const result = await resolveWorkOrder("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "You don't have permission to resolve work orders"
      );
    }
  });

  it("should require resolution notes", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    const formData = new FormData();
    // No resolution notes

    const result = await resolveWorkOrder("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Resolution notes are required");
    }
  });

  it("should resolve work order successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "TECH-001",
      name: "Tech",
      roleName: "tech",
      roleId: "2",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
      sessionVersion: 1,
    });

    mockFindFirstWorkOrder.mockResolvedValue({
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "in_progress",
      reportedById: "2",
      assignedToId: "1",
      dueBy: new Date(),
      departmentId: null,
      resolvedAt: null,
      resolutionNotes: null,
      escalatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set up transaction mock for resolve - needs update and insert chains
    mockTransaction.mockImplementation(async (callback) => {
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => Promise.resolve()),
        })),
      };
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    const formData = new FormData();
    formData.set("resolutionNotes", "Replaced the faulty component.");

    const result = await resolveWorkOrder("1", undefined, formData);

    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });
});

describe("addWorkOrderComment action", () => {
  beforeEach(() => {
    mockCreateNotification.mockClear();
    mockFindFirstEquipment.mockClear();
    mockFindManyUsers.mockClear();
    mockFindFirstWorkOrder.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("comment", "Test comment");

    const result = await addWorkOrderComment("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("You must be logged in");
    }
  });

  it("should require comment content", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    const formData = new FormData();
    formData.set("comment", "   "); // Only whitespace

    const result = await addWorkOrderComment("1", undefined, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Comment is required");
    }
  });

  it("should add comment successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    mockInsert.mockReturnValue({
      values: vi.fn(),
    });

    const formData = new FormData();
    formData.set("comment", "Additional details about the issue");

    const result = await addWorkOrderComment("1", undefined, formData);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should trim comment whitespace", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "1",
      displayId: 1,
      employeeId: "OP-001",
      name: "Operator",
      roleName: "operator",
      roleId: "1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator,
      sessionVersion: 1,
    });

    let capturedValues: unknown;
    mockInsert.mockReturnValue({
      values: vi.fn((val) => {
        capturedValues = val;
      }),
    });

    mockFindFirstWorkOrder.mockResolvedValue({
      id: "1",
      displayId: 1,
      equipmentId: "1",
      type: "breakdown",
      title: "Test",
      description: "Test",
      priority: "medium",
      status: "open",
      reportedById: "2",
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

    await addWorkOrderComment("1", undefined, formData);

    expect((capturedValues as Record<string, unknown>).newValue).toBe(
      "Trimmed comment"
    );
  });
});

describe("Notification triggers", () => {
  beforeEach(() => {
    mockCreateNotification.mockClear();
    mockFindFirstEquipment.mockClear();
    mockFindManyUsers.mockClear();
    mockFindFirstWorkOrder.mockClear();
    mockFindFirstRole.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  describe("updateWorkOrder notifications", () => {
    it("should notify reporter on status change", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        displayId: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "2", // Different from current user
        assignedToId: null,
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn() })),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("status", "in_progress");

      await updateWorkOrder("1", undefined, formData);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "2",
          type: "work_order_status_changed",
          title: expect.stringContaining("IN PROGRESS"),
        })
      );
    });

    it("should not notify reporter if they made the change", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        displayId: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "1", // Same as current user
        assignedToId: null,
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn() })),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("status", "in_progress");

      await updateWorkOrder("1", undefined, formData);

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });
  });

  describe("resolveWorkOrder notifications", () => {
    it("should notify reporter when work order is resolved", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        displayId: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: "2", // Different from current user (reporter)
        assignedToId: "1",
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn() })),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("resolutionNotes", "Fixed");

      await resolveWorkOrder("1", undefined, formData);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "2", // Reporter
          type: "work_order_resolved",
          title: "Your Work Order Has Been Resolved",
        })
      );
    });

    it("should not notify reporter if they resolved it themselves", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        displayId: 1, // Tech user
        employeeId: "TECH-001",
        name: "Tech",
        roleName: "tech",
        roleId: "2",
        permissions: DEFAULT_ROLE_PERMISSIONS.tech,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "in_progress",
        reportedById: "1", // Same as current user
        assignedToId: "1",
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUpdate.mockReturnValue({
        set: vi.fn(() => ({ where: vi.fn() })),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("resolutionNotes", "Fixed");

      await resolveWorkOrder("1", undefined, formData);

      expect(mockCreateNotification).not.toHaveBeenCalled();
    });
  });

  describe("addWorkOrderComment notifications", () => {
    it("should notify reporter and assignee when comment is added", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "3",
        displayId: 3, // Commenter
        employeeId: "OTHER-001",
        name: "Other User",
        roleName: "operator",
        roleId: "1",
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "1", // Reporter
        assignedToId: "2", // Assignee
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("comment", "New comment");

      await addWorkOrderComment("1", undefined, formData);

      // Should notify reporter
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "1",
          type: "work_order_commented",
        })
      );

      // Should notify assignee
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "2",
          type: "work_order_commented",
        })
      );
    });

    it("should not notify commenter if they are reporter or assignee", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        displayId: 1, // Commenter (also reporter)
        employeeId: "OP-001",
        name: "Operator",
        roleName: "operator",
        roleId: "1",
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "1", // Reporter is same as commenter
        assignedToId: "2", // Assignee
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("comment", "New comment");

      await addWorkOrderComment("1", undefined, formData);

      // Should NOT notify reporter (commenter)
      expect(mockCreateNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "1",
        })
      );

      // Should notify assignee
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "2",
        })
      );
    });

    it("should not send duplicate notification if reporter is assignee", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "3",
        displayId: 3, // Commenter
        employeeId: "OTHER-001",
        name: "Other User",
        roleName: "operator",
        roleId: "1",
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "1", // Reporter
        assignedToId: "1", // Assignee is same as reporter
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("comment", "New comment");

      await addWorkOrderComment("1", undefined, formData);

      // Should notify userId "1" only once
      const calls = mockCreateNotification.mock.calls;
      const notificationsToUser1 = calls.filter(
        (call: any) => call[0].userId === "1"
      );
      expect(notificationsToUser1.length).toBe(1);
    });

    it("should not notify when work order has no assignee", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "3",
        displayId: 3, // Commenter
        employeeId: "OTHER-001",
        name: "Other User",
        roleName: "operator",
        roleId: "1",
        permissions: DEFAULT_ROLE_PERMISSIONS.operator,
        sessionVersion: 1,
      });

      mockFindFirstWorkOrder.mockResolvedValue({
        id: "1",
        displayId: 1,
        equipmentId: "1",
        type: "breakdown",
        title: "Test Work Order",
        description: "Test",
        priority: "medium",
        status: "open",
        reportedById: "1",
        assignedToId: null, // No assignee
        dueBy: new Date(),
        departmentId: null,
        resolvedAt: null,
        resolutionNotes: null,
        escalatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockInsert.mockReturnValue({
        values: vi.fn(),
      });

      const formData = new FormData();
      formData.set("comment", "New comment");

      await addWorkOrderComment("1", undefined, formData);

      // Should notify reporter
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "1",
        })
      );

      // Should verify called exactly once (for reporter)
      expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    });
  });
});

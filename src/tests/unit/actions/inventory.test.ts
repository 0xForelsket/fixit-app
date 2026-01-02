// Actions will be imported dynamically after mocks
import { PERMISSIONS as PERMISSIONS_SOURCE } from "@/lib/permissions";
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockGetCurrentUser = mock();
const mockUserHasPermission = mock((user: any, permission: string) => {
  if (user?.permissions?.includes("*")) return true;
  return user?.permissions?.includes(permission) ?? false;
});
const mockRevalidatePath = mock();
const mockLogError = mock();

const mockFindFirstInventoryLevel = mock();
const mockInsert = mock();
const mockValues = mock();
const mockUpdate = mock();
const mockSet = mock();
const mockWhere = mock();
const mockDelete = mock();

// Chainable mocks
mockInsert.mockReturnValue({ values: mockValues });
mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockDelete.mockReturnValue({ where: mockWhere });

// Mock dependencies
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

mock.module("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  requirePermission: mock(() => true),
  hasPermission: mock(() => true),
  PERMISSIONS: PERMISSIONS_SOURCE,
}));

mock.module("@/lib/logger", () => ({
  inventoryLogger: {
    error: mockLogError,
  },
}));

mock.module("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// Transaction mock with full nested inventory level object
const mockTx = {
  query: {
    inventoryLevels: {
      findFirst: mockFindFirstInventoryLevel,
    },
    users: { findFirst: mock() },
    roles: { findFirst: mock() },
    workOrderParts: { findFirst: mock() },
  },
  insert: mockInsert,
  values: mockValues,
  update: mockUpdate,
  set: mockSet,
  where: mockWhere,
  delete: mockDelete,
};

mock.module("@/db", () => ({
  db: {
    transaction: mock((callback: any) => callback(mockTx)),
    query: {
      inventoryLevels: {
        findFirst: mockFindFirstInventoryLevel,
      },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

// Import actions dynamically after mocks are set up
const { createTransactionAction, consumeWorkOrderPartAction } = await import(
  "@/actions/inventory"
);

describe("inventory actions", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockUserHasPermission.mockClear();
    mockRevalidatePath.mockClear();
    mockLogError.mockClear();
    mockFindFirstInventoryLevel.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockUpdate.mockClear();
    mockSet.mockClear();
    mockWhere.mockClear();
    mockDelete.mockClear();
  });

  describe("createTransactionAction", () => {
    it("should throw error if unauthorized (no user)", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(
        createTransactionAction({
          partId: "p1",
          locationId: "l1",
          type: "in",
          quantity: 5,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error if insufficient permissions", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "1", permissions: [] });

      await expect(
        createTransactionAction({
          partId: "p1",
          locationId: "l1",
          type: "in",
          quantity: 5,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create 'in' transaction successfully", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        permissions: ["inventory:receive_stock"],
      });
      mockFindFirstInventoryLevel.mockResolvedValue({
        id: "1",
        quantity: 10,
        partId: "p1",
        locationId: "l1",
      });

      const result = await createTransactionAction({
        partId: "p1",
        locationId: "l1",
        type: "in",
        quantity: 5,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("consumeWorkOrderPartAction", () => {
    it("should throw error if unauthorized (no user)", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(
        consumeWorkOrderPartAction({
          workOrderId: "wo1",
          partId: "p1",
          locationId: "l1",
          quantity: 2,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error if insufficient permissions", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "1", permissions: [] });

      await expect(
        consumeWorkOrderPartAction({
          workOrderId: "wo1",
          partId: "p1",
          locationId: "l1",
          quantity: 2,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should consume parts successfully", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        permissions: ["inventory:use_parts"],
      });
      mockFindFirstInventoryLevel.mockResolvedValue({
        id: "1",
        quantity: 10,
        partId: "p1",
        locationId: "l1",
        part: { unitCost: 5.0 },
      });

      const result = await consumeWorkOrderPartAction({
        workOrderId: "wo1",
        partId: "p1",
        locationId: "l1",
        quantity: 2,
      });

      expect(result.success).toBe(true);
    });

    it("should error if insufficient stock", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "1",
        permissions: ["inventory:use_parts"],
      });
      mockFindFirstInventoryLevel.mockResolvedValue({
        id: "1",
        quantity: 1, // Only 1
        partId: "p1",
        locationId: "l1",
        part: { unitCost: 5.0 },
      });

      const result = await consumeWorkOrderPartAction({
        workOrderId: "wo1",
        partId: "p1",
        locationId: "l1",
        quantity: 2, // Need 2
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient stock");
    });
  });
});

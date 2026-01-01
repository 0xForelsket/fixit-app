import {
  consumeWorkOrderPartAction,
  createTransactionAction,
} from "@/actions/inventory";
import {
  inventoryLevels,
  inventoryTransactions,
  workOrderParts,
} from "@/db/schema";
import { userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  userHasPermission: vi.fn(),
  PERMISSIONS: {
    INVENTORY_RECEIVE_STOCK: "inventory:receive_stock",
    INVENTORY_USE_PARTS: "inventory:use_parts",
  },
}));

vi.mock("@/lib/logger", () => ({
  inventoryLogger: {
    error: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock DB - use vi.hoisted to avoid hoisting issues with vi.mock factory
const mockTx = vi.hoisted(() => ({
  query: {
    inventoryLevels: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx)
    ),
  },
}));

describe("Inventory Actions", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    employeeId: "TECH-001",
    roleName: "tech",
    sessionVersion: 1,
    permissions: ["inventory:receive_stock", "inventory:use_parts"],
    roleId: 1,
    hourlyRate: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
  });

  describe("createTransactionAction", () => {
    const validInput = {
      partId: 1,
      locationId: 1,
      type: "in" as const,
      quantity: 10,
      reference: "PO-123",
      notes: "Test transaction",
    };

    it("should throw error if user is unauthorized", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      await expect(createTransactionAction(validInput)).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should throw error if user lacks permission", async () => {
      vi.mocked(userHasPermission).mockReturnValue(false);

      await expect(createTransactionAction(validInput)).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should process 'in' transaction correctly", async () => {
      mockTx.query.inventoryLevels.findFirst.mockResolvedValue({
        id: 1,
        partId: 1,
        locationId: 1,
        quantity: 5,
      });

      const result = await createTransactionAction(validInput);

      expect(result.success).toBe(true);
      expect(mockTx.update).toHaveBeenCalledWith(inventoryLevels);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 15 })
      );
      expect(mockTx.insert).toHaveBeenCalledWith(inventoryTransactions);
    });

    it("should process 'out' transaction correctly", async () => {
      mockTx.query.inventoryLevels.findFirst.mockResolvedValue({
        id: 1,
        partId: 1,
        locationId: 1,
        quantity: 20,
      });

      const result = await createTransactionAction({
        ...validInput,
        type: "out",
        quantity: 5,
      });

      expect(result.success).toBe(true);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 15 })
      );
    });

    it("should fail if 'out' transaction results in negative stock", async () => {
      mockTx.query.inventoryLevels.findFirst.mockResolvedValue({
        id: 1,
        partId: 1,
        locationId: 1,
        quantity: 5,
      });

      const result = await createTransactionAction({
        ...validInput,
        type: "out",
        quantity: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Insufficient stock for this operation");
    });

    it("should process 'transfer' transaction correctly", async () => {
      mockTx.query.inventoryLevels.findFirst
        .mockResolvedValueOnce({
          id: 1,
          partId: 1,
          locationId: 1,
          quantity: 20,
        })
        .mockResolvedValueOnce(null);

      const result = await createTransactionAction({
        ...validInput,
        type: "transfer",
        toLocationId: 2,
        quantity: 5,
      });

      expect(result.success).toBe(true);
      expect(mockTx.update).toHaveBeenCalledWith(inventoryLevels);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 15 })
      );

      expect(mockTx.insert).toHaveBeenCalledWith(inventoryLevels);
      expect(mockTx.values).toHaveBeenCalledWith(
        expect.objectContaining({
          partId: 1,
          locationId: 2,
          quantity: 5,
        })
      );
    });
  });

  describe("consumeWorkOrderPartAction", () => {
    const validInput = {
      workOrderId: 1,
      partId: 1,
      locationId: 1,
      quantity: 2,
    };

    it("should throw error if user is unauthorized", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      await expect(consumeWorkOrderPartAction(validInput)).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should fail if stock is insufficient", async () => {
      mockTx.query.inventoryLevels.findFirst.mockResolvedValue({
        id: 1,
        quantity: 1,
        part: { unitCost: 10 },
      });

      const result = await consumeWorkOrderPartAction(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient stock");
    });

    it("should consume part and create logs", async () => {
      mockTx.query.inventoryLevels.findFirst.mockResolvedValue({
        id: 1,
        quantity: 10,
        part: { unitCost: 10 },
      });

      const result = await consumeWorkOrderPartAction(validInput);

      expect(result.success).toBe(true);
      expect(mockTx.update).toHaveBeenCalledWith(inventoryLevels);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 8 })
      );

      expect(mockTx.insert).toHaveBeenCalledWith(workOrderParts);

      expect(mockTx.insert).toHaveBeenCalledWith(inventoryTransactions);
    });
  });
});

import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS as PERMISSIONS_SOURCE,
} from "@/lib/permissions";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the notifications helper
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(true),
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

// Helper to create chainable query mocks
const createMockQuery = (resolvedValue: any = []) => {
  const promise = Promise.resolve(resolvedValue);
  // @ts-ignore
  promise.where = vi.fn(() => createMockQuery(resolvedValue));
  // @ts-ignore
  promise.limit = vi.fn(() => createMockQuery(resolvedValue));
  // @ts-ignore
  promise.from = vi.fn(() => createMockQuery(resolvedValue));
  return promise;
};

// Global mock state we can manipulate in tests
let mockSelectResponseSchedules: any[] = [];
let mockSelectResponseEquipment: any[] = [];
let mockSelectCalls = 0;

const mockTransaction = vi.fn(
  async (callback: (tx: unknown) => Promise<unknown>) => {
    mockSelectCalls = 0; // Reset for each transaction
    const mockTx = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
      delete: mockDelete,
      select: vi.fn((_fields) => ({
        from: vi.fn(() => {
          mockSelectCalls++;
          // First call is checking schedules, second is getting equipment details
          const response =
            mockSelectCalls === 1
              ? mockSelectResponseSchedules
              : mockSelectResponseEquipment;
          return createMockQuery(response);
        }),
      })),
    };
    return await callback(mockTx);
  }
);

// ... existing setup ...

// Mock auth
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

// Mock db
vi.mock("@/db", () => ({
  db: {
    query: {
      equipment: { findFirst: mockFindFirstEquipment },
      users: { findMany: mockFindManyUsers },
      workOrders: { findFirst: mockFindFirstWorkOrder },
      roles: { findFirst: mockFindFirstRole },
    },
    transaction: mockTransaction,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

const mockGetCurrentUser = vi.fn();

// Mock session
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  workOrderLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import actions
import { createMeter, deleteMeter, recordReading } from "@/actions/meters";

describe("createMeter action", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const formData = new FormData();
    const result = await createMeter("eq-1", undefined, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("You must be logged in");
  });

  it("should return error when user lacks permission", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "op-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.operator, // Operator cannot manage equipment
    });
    const formData = new FormData();
    const result = await createMeter("eq-1", undefined, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("You don't have permission");
  });

  it("should return error for invalid input", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "admin-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });
    const formData = new FormData();
    // Missing required fields
    const result = await createMeter("eq-1", undefined, formData);
    expect(result.success).toBe(false);
  });

  it("should create meter successfully", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "admin-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });
    const formData = new FormData();
    formData.set("name", "Engine Hours");
    formData.set("type", "hours");
    formData.set("unit", "hrs");
    formData.set("currentReading", "100.5");

    const result = await createMeter("eq-1", undefined, formData);
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("recordReading action", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockTransaction.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const formData = new FormData();
    const result = await recordReading(undefined, formData);
    expect(result.success).toBe(false);
  });

  it("should successfuly record reading", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "tech-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech, // Techs can update equipment/record readings
    });

    const formData = new FormData();
    formData.set("meterId", "meter-1");
    formData.set("reading", "120.5");
    formData.set("notes", "Routine check");

    const result = await recordReading(undefined, formData);

    expect(result.success).toBe(true);
    // Should run in transaction
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("should trigger maintenance when interval exceeded", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "tech-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.tech,
    });

    // Setup schedule that should trigger
    mockSelectResponseSchedules = [
      {
        id: "schedule-1",
        title: "Oil Change",
        meterInterval: 100,
        lastTriggerReading: "0",
        equipmentId: "eq-1",
        isActive: true, // IMPORTANT: trigger checks isActive
        meterId: "meter-1",
      },
    ];

    // Setup equipment department response
    mockSelectResponseEquipment = [{ departmentId: "dept-1" }];

    const formData = new FormData();
    formData.set("meterId", "meter-1");
    formData.set("reading", "100"); // 100 - 0 >= 100 -> Trigger
    formData.set("notes", "Trigger check");

    const result = await recordReading(undefined, formData);

    expect(result.success).toBe(true);
    // Should run transaction
    expect(mockTransaction).toHaveBeenCalled();
  });
});

describe("deleteMeter action", () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockGetCurrentUser.mockClear();
  });

  it("should return error when not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const result = await deleteMeter("meter-1");
    expect(result.success).toBe(false);
  });

  it("should successfuly delete meter", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "admin-1",
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
    });

    const result = await deleteMeter("meter-1");
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });
});

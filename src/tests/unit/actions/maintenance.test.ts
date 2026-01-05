import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/actions/maintenance";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentUser,
  mockUserHasPermission,
  mockRevalidatePath,
  mockRedirect,
  mockInsert,
  mockValues,
  mockReturning,
  mockUpdate,
  mockSet,
  mockWhere,
  mockDelete,
  mockTx,
} = vi.hoisted(() => {
  const mInsert = vi.fn();
  const mValues = vi.fn();
  const mReturning = vi.fn();
  const mUpdate = vi.fn();
  const mSet = vi.fn();
  const mWhere = vi.fn();
  const mDelete = vi.fn();

  // Chainable mocks
  mInsert.mockReturnValue({ values: mValues });
  mValues.mockReturnValue({ returning: mReturning });
  mUpdate.mockReturnValue({ set: mSet });
  mSet.mockReturnValue({ where: mWhere });
  mWhere.mockReturnValue({ returning: mReturning });
  mDelete.mockReturnValue({ where: mWhere });

  const tx = {
    insert: mInsert,
    values: mValues,
    returning: mReturning,
    update: mUpdate,
    set: mSet,
    where: mWhere,
    delete: mDelete,
    transaction: vi.fn((callback: any) => callback(tx)),
  };

  return {
    mockGetCurrentUser: vi.fn(),
    mockUserHasPermission: vi.fn(),
    mockRevalidatePath: vi.fn(),
    mockRedirect: vi.fn(),
    mockInsert: mInsert,
    mockValues: mValues,
    mockReturning: mReturning,
    mockUpdate: mUpdate,
    mockSet: mSet,
    mockWhere: mWhere,
    mockDelete: mDelete,
    mockTx: tx,
  };
});

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    MAINTENANCE_CREATE: "maintenance:create",
    MAINTENANCE_UPDATE: "maintenance:update",
    MAINTENANCE_DELETE: "maintenance:delete",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/db", () => ({
  db: mockTx,
}));

describe("Maintenance Actions", () => {
  const mockUser = {
    id: "1",
    displayId: 1,
    name: "Tech User",
    employeeId: "TECH-001",
    roleName: "tech",
    sessionVersion: 1,
    permissions: [
      "maintenance:create",
      "maintenance:update",
      "maintenance:delete",
    ],
    roleId: "1",
    hourlyRate: null,
  };

  beforeEach(() => {
    mockGetCurrentUser.mockClear();
    mockUserHasPermission.mockClear();
    mockRevalidatePath.mockClear();
    mockRedirect.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
    mockUpdate.mockClear();
    mockSet.mockClear();
    mockWhere.mockClear();
    mockDelete.mockClear();

    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockUserHasPermission.mockReturnValue(true);
  });

  describe("createScheduleAction", () => {
    const validInput = {
      title: "Monthly Service",
      equipmentId: "1",
      type: "maintenance" as const,
      frequencyDays: 30,
      isActive: true,
      checklists: [
        {
          stepNumber: 1,
          description: "Check oil",
          isRequired: true,
          estimatedMinutes: 10,
        },
      ],
    };

    it("should return error if user is unauthorized", async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      const result = await createScheduleAction(validInput);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error if user lacks permission", async () => {
      mockUserHasPermission.mockReturnValue(false);
      const result = await createScheduleAction(validInput);
      expect(result.error).toBe("Unauthorized");
    });

    it("should create schedule and checklists successfully", async () => {
      mockReturning.mockResolvedValue([{ id: "100", displayId: 100 }]);

      await createScheduleAction(validInput);

      expect(mockInsert).toHaveBeenCalledWith(maintenanceSchedules);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Monthly Service",
          equipmentId: "1",
        })
      );

      expect(mockInsert).toHaveBeenCalledWith(maintenanceChecklists);
      expect(mockValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            scheduleId: "100",
            description: "Check oil",
          }),
        ])
      );
    });
  });

  describe("updateScheduleAction", () => {
    const scheduleId = "100";
    const updateInput = {
      title: "Updated Service",
      equipmentId: "1",
      type: "maintenance" as const,
      frequencyDays: 60,
      isActive: true,
      checklists: [],
    };

    it("should update schedule successfully", async () => {
      mockReturning.mockResolvedValue([{ id: scheduleId }]);

      await updateScheduleAction(scheduleId, updateInput);

      expect(mockUpdate).toHaveBeenCalledWith(maintenanceSchedules);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated Service",
          frequencyDays: 60,
        })
      );
    });

    it("should return error if schedule not found", async () => {
      mockReturning.mockResolvedValue([]);

      const result = await updateScheduleAction(scheduleId, updateInput);

      expect(result.error).toBe("Schedule not found");
    });
  });

  describe("deleteScheduleAction", () => {
    const scheduleId = "100";

    it("should delete schedule successfully", async () => {
      mockReturning.mockResolvedValue([{ id: scheduleId }]);

      const result = await deleteScheduleAction(scheduleId);

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(maintenanceChecklists);
      expect(mockDelete).toHaveBeenCalledWith(maintenanceSchedules);
    });

    it("should return error if schedule not found", async () => {
      mockReturning.mockResolvedValue([]);

      const result = await deleteScheduleAction(scheduleId);

      expect(result.error).toBe("Schedule not found");
    });
  });
});

import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/actions/maintenance";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockGetCurrentUser = mock();
const mockUserHasPermission = mock();
const mockRevalidatePath = mock();
const mockRedirect = mock();

const mockInsert = mock();
const mockValues = mock();
const mockReturning = mock();
const mockUpdate = mock();
const mockSet = mock();
const mockWhere = mock();
const mockDelete = mock();

// Chainable mocks
mockInsert.mockReturnValue({ values: mockValues });
mockValues.mockReturnValue({ returning: mockReturning });
mockUpdate.mockReturnValue({ set: mockSet });
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ returning: mockReturning });
// For delete
mockDelete.mockReturnValue({ where: mockWhere });

// Mock dependencies
mock.module("@/lib/session", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

mock.module("@/lib/auth", () => ({
  userHasPermission: mockUserHasPermission,
  PERMISSIONS: {
    MAINTENANCE_CREATE: "maintenance:create",
    MAINTENANCE_UPDATE: "maintenance:update",
    MAINTENANCE_DELETE: "maintenance:delete",
  },
}));

mock.module("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

mock.module("next/navigation", () => ({
  redirect: mockRedirect,
}));

const mockTx = {
  insert: mockInsert,
  values: mockValues,
  returning: mockReturning,
  update: mockUpdate,
  set: mockSet,
  where: mockWhere,
  delete: mockDelete,
  // transaction just calls the callback with itself
  transaction: mock((callback: any) => callback(mockTx)),
};

mock.module("@/db", () => ({
  db: mockTx,
}));

// Import after mocking
import { userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

describe("Maintenance Actions", () => {
  const mockUser = {
    id: "1", displayId: 1,
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

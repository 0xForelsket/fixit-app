import {
  createScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/actions/maintenance";
import { maintenanceChecklists, maintenanceSchedules } from "@/db/schema";
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
    MAINTENANCE_CREATE: "maintenance:create",
    MAINTENANCE_UPDATE: "maintenance:update",
    MAINTENANCE_DELETE: "maintenance:delete",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock DB - use vi.hoisted to avoid hoisting issues with vi.mock factory
// Create a proper chainable mock that supports Drizzle's fluent API
const mockReturning = vi.hoisted(() => vi.fn());
const mockWhere = vi.hoisted(() => vi.fn(() => ({ returning: mockReturning })));
const mockSet = vi.hoisted(() =>
  vi.fn(() => ({ where: mockWhere, returning: mockReturning }))
);
const mockValues = vi.hoisted(() =>
  vi.fn(() => ({ returning: mockReturning }))
);

const mockTx = vi.hoisted(() => ({
  insert: vi.fn(() => ({ values: mockValues })),
  values: mockValues,
  returning: mockReturning,
  update: vi.fn(() => ({ set: mockSet })),
  set: mockSet,
  where: mockWhere,
  delete: vi.fn(() => ({ where: mockWhere, returning: mockReturning })),
}));

vi.mock("@/db", () => ({
  db: mockTx,
}));

describe("Maintenance Actions", () => {
  const mockUser = {
    id: 1,
    name: "Tech User",
    employeeId: "TECH-001",
    roleName: "tech",
    permissions: [
      "maintenance:create",
      "maintenance:update",
      "maintenance:delete",
    ],
    roleId: 1,
    hourlyRate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(userHasPermission).mockReturnValue(true);
  });

  describe("createScheduleAction", () => {
    const validInput = {
      title: "Monthly Service",
      equipmentId: 1,
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
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const result = await createScheduleAction(validInput);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error if user lacks permission", async () => {
      vi.mocked(userHasPermission).mockReturnValue(false);
      const result = await createScheduleAction(validInput);
      expect(result.error).toBe("Unauthorized");
    });

    it("should create schedule and checklists successfully", async () => {
      mockReturning.mockResolvedValue([{ id: 100 }]);

      await createScheduleAction(validInput);

      expect(mockTx.insert).toHaveBeenCalledWith(maintenanceSchedules);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Monthly Service",
          equipmentId: 1,
        })
      );

      expect(mockTx.insert).toHaveBeenCalledWith(maintenanceChecklists);
      expect(mockValues).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            scheduleId: 100,
            description: "Check oil",
          }),
        ])
      );
    });
  });

  describe("updateScheduleAction", () => {
    const scheduleId = 100;
    const updateInput = {
      title: "Updated Service",
      equipmentId: 1,
      type: "maintenance" as const,
      frequencyDays: 60,
      isActive: true,
      checklists: [],
    };

    it("should update schedule successfully", async () => {
      mockReturning.mockResolvedValue([{ id: scheduleId }]);

      await updateScheduleAction(scheduleId, updateInput);

      expect(mockTx.update).toHaveBeenCalledWith(maintenanceSchedules);
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
    const scheduleId = 100;

    it("should delete schedule successfully", async () => {
      mockReturning.mockResolvedValue([{ id: scheduleId }]);

      const result = await deleteScheduleAction(scheduleId);

      expect(result.success).toBe(true);
      expect(mockTx.delete).toHaveBeenCalledWith(maintenanceChecklists);
      expect(mockTx.delete).toHaveBeenCalledWith(maintenanceSchedules);
    });

    it("should return error if schedule not found", async () => {
      mockReturning.mockResolvedValue([]);

      const result = await deleteScheduleAction(scheduleId);

      expect(result.error).toBe("Schedule not found");
    });
  });
});

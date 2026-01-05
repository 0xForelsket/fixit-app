import { beforeEach, describe, expect, it, mock } from "vitest";

// Create mocks
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn(() => ([{ id: "1", displayId: 1 }]));

// Mock the db module
vi.vi.fn("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
    },
    insert: mockInsert.mockReturnValue({
      values: mockValues.mockReturnValue({
        returning: mockReturning,
      }),
    }),
  },
}));

// Mock SSE module
vi.vi.fn("@/lib/sse", () => ({
  sendToUser: vi.fn(),
}));

const {
  createCriticalNotification,
  createNotification,
  createNotificationsForUsers,
} = await import("@/lib/notifications");

describe("notifications helper", () => {
  beforeEach(() => {
    mockFindFirst.mockClear();
    mockFindMany.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
    // Reset mocks
    mockInsert.mockReturnValue({
      values: mockValues.mockReturnValue({
        returning: mockReturning.mockResolvedValue([{ id: "1", displayId: 1 }]),
      }),
    });
  });

  describe("createNotification", () => {
    it("creates notification when user has no preferences set", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: null,
      });

      const result = await createNotification({
        userId: "1",
        type: "work_order_assigned",
        title: "Test Title",
        message: "Test Message",
        link: "/test",
      });

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("creates notification when user has preferences but no inApp settings", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: {
          theme: "dark",
          density: "comfortable",
          notifications: { email: true },
        },
      });

      const result = await createNotification({
        userId: "1",
        type: "work_order_resolved",
        title: "Resolved",
        message: "Your work order was resolved",
      });

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("creates notification when notification type is enabled", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: {
          theme: "system",
          density: "comfortable",
          notifications: {
            email: true,
            inApp: {
              workOrderCreated: true,
              workOrderAssigned: true,
              workOrderEscalated: true,
              workOrderResolved: true,
              workOrderCommented: true,
              workOrderStatusChanged: true,
              maintenanceDue: true,
            },
          },
        },
      });

      const result = await createNotification({
        userId: "1",
        type: "work_order_commented",
        title: "New Comment",
        message: "Someone commented",
        link: "/work-orders/1",
      });

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("skips notification when notification type is disabled", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: {
          theme: "system",
          density: "comfortable",
          notifications: {
            email: true,
            inApp: {
              workOrderCreated: true,
              workOrderAssigned: true,
              workOrderEscalated: true,
              workOrderResolved: true,
              workOrderCommented: false, // Disabled
              workOrderStatusChanged: true,
              maintenanceDue: true,
            },
          },
        },
      });

      const result = await createNotification({
        userId: "1",
        type: "work_order_commented",
        title: "New Comment",
        message: "Someone commented",
      });

      expect(result).toBe(false);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("skips notification when escalation type is disabled", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: {
          theme: "system",
          density: "comfortable",
          notifications: {
            email: true,
            inApp: {
              workOrderCreated: true,
              workOrderAssigned: true,
              workOrderEscalated: false, // Disabled
              workOrderResolved: true,
              workOrderCommented: true,
              workOrderStatusChanged: true,
              maintenanceDue: true,
            },
          },
        },
      });

      const result = await createNotification({
        userId: "1",
        type: "work_order_escalated",
        title: "Escalated",
        message: "SLA breached",
      });

      expect(result).toBe(false);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("creates notification without link when not provided", async () => {
      mockFindFirst.mockResolvedValue({
        preferences: null,
      });

      await createNotification({
        userId: "1",
        type: "maintenance_due",
        title: "Maintenance Due",
        message: "Check equipment",
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          link: null,
        })
      );
    });
  });

  describe("createNotificationsForUsers", () => {
    it("returns 0 when userIds array is empty", async () => {
      const result = await createNotificationsForUsers(
        [],
        "work_order_created",
        "Title",
        "Message"
      );

      expect(result).toBe(0);
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it("creates notifications for multiple users", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", preferences: null },
        { id: "2", preferences: null },
        { id: "3", preferences: null },
      ]);
      mockReturning.mockResolvedValue([
        { id: "n1", userId: "1" },
        { id: "n2", userId: "2" },
        { id: "n3", userId: "3" },
      ]);

      const result = await createNotificationsForUsers(
        ["1", "2", "3"],
        "work_order_assigned",
        "Assigned",
        "You were assigned",
        "/work-orders/1"
      );

      expect(result).toBe(3);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("respects each user preferences individually", async () => {
      mockFindMany.mockResolvedValue([
        { id: "1", preferences: null }, // User 1: no prefs, create
        { id: "2", preferences: { // User 2: disabled, skip
          theme: "system",
          density: "comfortable",
          notifications: {
            email: true,
            inApp: {
              workOrderCreated: false,
              workOrderAssigned: false,
              workOrderEscalated: false,
              workOrderResolved: false,
              workOrderCommented: false,
              workOrderStatusChanged: false,
              maintenanceDue: false,
            },
          },
        }},
        { id: "3", preferences: null }, // User 3: no prefs, create
      ]);
      mockReturning.mockResolvedValue([
        { id: "n1", userId: "1" },
        { id: "n3", userId: "3" },
      ]);

      const result = await createNotificationsForUsers(
        ["1", "2", "3"],
        "work_order_assigned",
        "Assigned",
        "You were assigned"
      );

      expect(result).toBe(2); // Only 2 created (users 1 and 3)
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("createCriticalNotification", () => {
    it("creates notification without checking preferences", async () => {
      // Note: createCriticalNotification doesn't check preferences
      await createCriticalNotification({
        userId: "1",
        type: "work_order_escalated",
        title: "Critical Alert",
        message: "System down",
        link: "/alerts",
      });

      // Should not query user preferences
      expect(mockFindFirst).not.toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module
vi.mock("@/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: "1", displayId: 1 }]),
      })),
    })),
  },
}));

import { db } from "@/db";
import {
  createCriticalNotification,
  createNotification,
  createNotificationsForUsers,
} from "@/lib/notifications";

describe("notifications helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("creates notification when user has no preferences set", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        preferences: null,
      } as any);

      const result = await createNotification({
        userId: "1",
        type: "work_order_assigned",
        title: "Test Title",
        message: "Test Message",
        link: "/test",
      });

      expect(result).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it("creates notification when user has preferences but no inApp settings", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        preferences: {
          theme: "dark",
          density: "comfortable",
          notifications: { email: true },
        },
      } as any);

      const result = await createNotification({
        userId: "1",
        type: "work_order_resolved",
        title: "Resolved",
        message: "Your work order was resolved",
      });

      expect(result).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it("creates notification when notification type is enabled", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
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
      } as any);

      const result = await createNotification({
        userId: "1",
        type: "work_order_commented",
        title: "New Comment",
        message: "Someone commented",
        link: "/work-orders/1",
      });

      expect(result).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it("skips notification when notification type is disabled", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
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
      } as any);

      const result = await createNotification({
        userId: "1",
        type: "work_order_commented",
        title: "New Comment",
        message: "Someone commented",
      });

      expect(result).toBe(false);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("skips notification when escalation type is disabled", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
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
      } as any);

      const result = await createNotification({
        userId: "1",
        type: "work_order_escalated",
        title: "Escalated",
        message: "SLA breached",
      });

      expect(result).toBe(false);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("creates notification without link when not provided", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        preferences: null,
      } as any);

      await createNotification({
        userId: "1",
        type: "maintenance_due",
        title: "Maintenance Due",
        message: "Check equipment",
      });

      expect(db.insert).toHaveBeenCalled();
      const insertMock = vi.mocked(db.insert);
      const valuesMock = insertMock.mock.results[0]?.value?.values;
      expect(valuesMock).toHaveBeenCalledWith(
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
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });

    it("creates notifications for multiple users", async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        preferences: null,
      } as any);

      const result = await createNotificationsForUsers(
        ["1", "2", "3"],
        "work_order_assigned",
        "Assigned",
        "You were assigned",
        "/work-orders/1"
      );

      expect(result).toBe(3);
      expect(db.insert).toHaveBeenCalledTimes(3);
    });

    it("respects each user preferences individually", async () => {
      vi.mocked(db.query.users.findFirst)
        .mockResolvedValueOnce({ preferences: null } as any) // User 1: no prefs, create
        .mockResolvedValueOnce({
          // User 2: disabled, skip
          preferences: {
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
          },
        } as any)
        .mockResolvedValueOnce({ preferences: null } as any); // User 3: no prefs, create

      const result = await createNotificationsForUsers(
        ["1", "2", "3"],
        "work_order_assigned",
        "Assigned",
        "You were assigned"
      );

      expect(result).toBe(2); // Only 2 created (users 1 and 3)
      expect(db.insert).toHaveBeenCalledTimes(2);
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
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });
});

import { db } from "@/db";
import {
  type InAppNotificationPreferences,
  type NotificationType,
  type UserPreferences,
  notifications,
  users,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendToUser } from "./sse";

/**
 * Maps notification types to their corresponding preference keys.
 */
const NOTIFICATION_TYPE_TO_PREF_KEY: Record<
  NotificationType,
  keyof InAppNotificationPreferences
> = {
  work_order_created: "workOrderCreated",
  work_order_assigned: "workOrderAssigned",
  work_order_escalated: "workOrderEscalated",
  work_order_resolved: "workOrderResolved",
  work_order_commented: "workOrderCommented",
  work_order_status_changed: "workOrderStatusChanged",
  maintenance_due: "maintenanceDue",
};

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates a notification if the user has not disabled this notification type.
 * Returns true if notification was created, false if skipped due to preferences.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<boolean> {
  const { userId, type, title, message, link } = params;

  // Fetch user preferences
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { preferences: true },
  });

  const prefs = user?.preferences;
  const prefKey = NOTIFICATION_TYPE_TO_PREF_KEY[type];

  // Check if user has disabled this notification type
  // Default to true (enabled) if preferences are not set
  if (prefs?.notifications?.inApp && prefKey) {
    const isEnabled = prefs.notifications.inApp[prefKey];
    if (isEnabled === false) {
      return false; // User has explicitly disabled this notification type
    }
  }

  // Create the notification
  const [inserted] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      message,
      link: link ?? null,
    })
    .returning();

  // Push to connected SSE clients in real-time
  if (inserted) {
    sendToUser(userId, {
      event: "notification",
      data: inserted,
    });
  }

  return true;
}

/**
 * Helper function to check if a user should receive a notification based on preferences.
 */
function shouldReceiveNotification(
  prefs: UserPreferences | null | undefined,
  type: NotificationType
): boolean {
  const prefKey = NOTIFICATION_TYPE_TO_PREF_KEY[type];

  // Default to true (enabled) if preferences are not set
  if (!prefs?.notifications?.inApp || !prefKey) {
    return true;
  }

  const isEnabled = prefs.notifications.inApp[prefKey];
  // Only skip if explicitly set to false
  return isEnabled !== false;
}

/**
 * Creates notifications for multiple users, respecting each user's preferences.
 * Optimized to batch fetch user preferences and batch insert notifications.
 * Returns the number of notifications actually created.
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<number> {
  if (userIds.length === 0) return 0;

  // Batch fetch all user preferences in a single query
  const userPrefs = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: { id: true, preferences: true },
  });

  // Create a map for quick lookup
  const prefsMap = new Map(userPrefs.map((u) => [u.id, u.preferences]));

  // Filter users who should receive this notification type
  const eligibleUserIds = userIds.filter((userId) => {
    const prefs = prefsMap.get(userId);
    return shouldReceiveNotification(prefs, type);
  });

  if (eligibleUserIds.length === 0) return 0;

  // Batch insert all notifications in a single query
  const notificationsToInsert = eligibleUserIds.map((userId) => ({
    userId,
    type,
    title,
    message,
    link: link ?? null,
  }));

  const inserted = await db
    .insert(notifications)
    .values(notificationsToInsert)
    .returning();

  // Push to connected SSE clients in real-time
  for (const notification of inserted) {
    sendToUser(notification.userId, {
      event: "notification",
      data: notification,
    });
  }

  return inserted.length;
}

/**
 * Creates a notification without checking preferences.
 * Use this for critical notifications that should always be sent.
 */
export async function createCriticalNotification(
  params: CreateNotificationParams
): Promise<void> {
  const { userId, type, title, message, link } = params;

  const [inserted] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      message,
      link: link ?? null,
    })
    .returning();

  // Push to connected SSE clients in real-time
  if (inserted) {
    sendToUser(userId, {
      event: "notification",
      data: inserted,
    });
  }
}

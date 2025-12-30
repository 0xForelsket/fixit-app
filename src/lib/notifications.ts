import { db } from "@/db";
import {
  type InAppNotificationPreferences,
  type NotificationType,
  notifications,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";

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
  userId: number;
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
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    link: link ?? null,
  });

  return true;
}

/**
 * Creates notifications for multiple users, respecting each user's preferences.
 * Returns the number of notifications actually created.
 */
export async function createNotificationsForUsers(
  userIds: number[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<number> {
  if (userIds.length === 0) return 0;

  let created = 0;
  for (const userId of userIds) {
    const wasCreated = await createNotification({
      userId,
      type,
      title,
      message,
      link,
    });
    if (wasCreated) created++;
  }
  return created;
}

/**
 * Creates a notification without checking preferences.
 * Use this for critical notifications that should always be sent.
 */
export async function createCriticalNotification(
  params: CreateNotificationParams
): Promise<void> {
  const { userId, type, title, message, link } = params;

  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    link: link ?? null,
  });
}

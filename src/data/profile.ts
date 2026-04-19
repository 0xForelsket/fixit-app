import { db } from "@/db";
import {
  type InAppNotificationPreferences,
  type UserPreferences,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

const DEFAULT_IN_APP_PREFERENCES: InAppNotificationPreferences = {
  workOrderCreated: true,
  workOrderAssigned: true,
  workOrderEscalated: true,
  workOrderResolved: true,
  workOrderCommented: true,
  workOrderStatusChanged: true,
  maintenanceDue: true,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  density: "comfortable",
  notifications: {
    email: true,
    inApp: DEFAULT_IN_APP_PREFERENCES,
  },
};

export function resolveUserPreferences(
  preferences: UserPreferences | null | undefined
): UserPreferences {
  const defaultInApp = DEFAULT_PREFERENCES.notifications.inApp
    ? DEFAULT_PREFERENCES.notifications.inApp
    : DEFAULT_IN_APP_PREFERENCES;
  const inAppPreferences = {
    workOrderCreated:
      preferences?.notifications.inApp?.workOrderCreated ??
      defaultInApp.workOrderCreated,
    workOrderAssigned:
      preferences?.notifications.inApp?.workOrderAssigned ??
      defaultInApp.workOrderAssigned,
    workOrderEscalated:
      preferences?.notifications.inApp?.workOrderEscalated ??
      defaultInApp.workOrderEscalated,
    workOrderResolved:
      preferences?.notifications.inApp?.workOrderResolved ??
      defaultInApp.workOrderResolved,
    workOrderCommented:
      preferences?.notifications.inApp?.workOrderCommented ??
      defaultInApp.workOrderCommented,
    workOrderStatusChanged:
      preferences?.notifications.inApp?.workOrderStatusChanged ??
      defaultInApp.workOrderStatusChanged,
    maintenanceDue:
      preferences?.notifications.inApp?.maintenanceDue ??
      defaultInApp.maintenanceDue,
  };

  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...preferences?.notifications,
      inApp: inAppPreferences,
    },
  };
}

export async function getProfileData() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionUser.id),
    with: {
      assignedRole: true,
      department: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    roleName: user.assignedRole?.name,
    departmentName: user.department?.name,
    preferences: resolveUserPreferences(user.preferences),
  };
}

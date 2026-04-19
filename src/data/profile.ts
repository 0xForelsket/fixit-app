import { db } from "@/db";
import { type UserPreferences, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export const DEFAULT_PREFERENCES: UserPreferences = {
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
};

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
  };
}

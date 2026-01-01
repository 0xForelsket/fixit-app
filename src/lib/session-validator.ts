import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "./session";

export async function isSessionVersionValid(
  user: SessionUser
): Promise<boolean> {
  // If no session version in the token, allow it (legacy sessions)
  if (user.sessionVersion === undefined || user.sessionVersion === null) {
    return true;
  }

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { sessionVersion: true, isActive: true },
    });

    // User not found or deactivated - reject session
    if (!dbUser || !dbUser.isActive) {
      return false;
    }

    // Session version mismatch - user changed their PIN
    const currentVersion = dbUser.sessionVersion ?? 1;
    if (user.sessionVersion !== currentVersion) {
      return false;
    }

    return true;
  } catch (error) {
    // On database error, reject the session for security
    console.error("Failed to validate session version:", error);
    return false;
  }
}

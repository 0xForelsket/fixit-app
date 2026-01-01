import { db } from "@/db";
import { type EntityType, auditLogs } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

/**
 * Log an action to the system-wide audit trail
 */
export async function logAudit({
  entityType,
  entityId,
  action,
  details,
}: {
  entityType: EntityType;
  entityId: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "LOGOUT_ALL"
    | "BULK_UPDATE";
  details?: Record<string, unknown>;
}) {
  try {
    const user = await getCurrentUser();

    await db.insert(auditLogs).values({
      entityType,
      entityId,
      action,
      details: details ? JSON.stringify(details) : null,
      userId: user?.id || null,
    });
  } catch (error) {
    // Audit logging should not break the main flow
    console.error("Failed to log audit:", error);
  }
}

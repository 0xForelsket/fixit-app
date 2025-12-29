import { db } from "@/db";
import { roles, users, workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const requestId = generateRequestId();
  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        resolvedCount: sql<number>`count(CASE WHEN ${workOrders.status} = 'resolved' OR ${workOrders.status} = 'closed' THEN 1 END)`,
        activeCount: sql<number>`count(CASE WHEN ${workOrders.status} = 'open' OR ${workOrders.status} = 'in_progress' THEN 1 END)`,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(workOrders, eq(users.id, workOrders.assignedToId))
      .where(eq(roles.name, "tech"))
      .groupBy(users.id);

    return apiSuccess(result);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Tech stats error");
    return ApiErrors.internal(error, requestId);
  }
}

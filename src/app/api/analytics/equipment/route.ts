import { db } from "@/db";
import { equipment, workOrders } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  const requestId = generateRequestId();
  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    const result = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        breakdowns:
          sql<number>`count(CASE WHEN ${workOrders.type} = 'breakdown' THEN 1 END)`.as(
            "breakdowns"
          ),
        totalWorkOrders: sql<number>`count(${workOrders.id})`,
      })
      .from(equipment)
      .leftJoin(workOrders, eq(equipment.id, workOrders.equipmentId))
      .groupBy(equipment.id)
      .orderBy(desc(sql`breakdowns`))
      .limit(10);

    // Mock downtime for now (random hours for demo/MVP)
    const equipmentWithMockDowntime = result.map((m) => ({
      ...m,
      downtimeHours: Number(m.breakdowns) * 2 + Math.floor(Math.random() * 5), // Mock logic: ~2h per breakdown + noise
    }));

    return apiSuccess(equipmentWithMockDowntime);
  } catch (error) {
    apiLogger.error({ requestId, error }, "Equipment analytics error");
    return ApiErrors.internal(error, requestId);
  }
}

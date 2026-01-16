import { db } from "@/db";
import { equipment, equipmentPredictions } from "@/db/schema";
import { ApiErrors, apiSuccess } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const requestId = generateRequestId();

  // Rate limiting for analytics queries
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(
    `analytics:${clientIp}`,
    RATE_LIMITS.analytics.limit,
    RATE_LIMITS.analytics.windowMs
  );

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    return ApiErrors.rateLimited(retryAfter, requestId);
  }

  const user = await getCurrentUser();

  if (!user || !userHasPermission(user, PERMISSIONS.ANALYTICS_VIEW)) {
    return ApiErrors.unauthorized(requestId);
  }

  try {
    // Fetch active (unacknowledged) predictions with equipment details
    const predictions = await db
      .select({
        id: equipmentPredictions.id,
        equipmentId: equipmentPredictions.equipmentId,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        predictionType: equipmentPredictions.predictionType,
        probability: equipmentPredictions.probability,
        estimatedDate: equipmentPredictions.estimatedDate,
        confidence: equipmentPredictions.confidence,
        factors: equipmentPredictions.factors,
        createdAt: equipmentPredictions.createdAt,
      })
      .from(equipmentPredictions)
      .innerJoin(equipment, eq(equipmentPredictions.equipmentId, equipment.id))
      .where(eq(equipmentPredictions.isAcknowledged, false))
      .orderBy(desc(equipmentPredictions.probability))
      .limit(20);

    return apiSuccess(
      predictions.map((p) => ({
        ...p,
        probability: Number(p.probability),
        confidence: p.confidence ? Number(p.confidence) : null,
      })),
      undefined,
      undefined,
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    apiLogger.error({ requestId, error }, "Predictions fetch error");
    return ApiErrors.internal(error, requestId);
  }
}

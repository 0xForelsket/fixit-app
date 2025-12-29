import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "ok" | "error";
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: "ok" | "warning" | "error";
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
  };
}

const startTime = Date.now();

/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Returns the health status of the application including:
 * - Database connectivity and latency
 * - Memory usage
 * - Uptime
 *
 * This endpoint is public and used by:
 * - Load balancers for health checks
 * - Monitoring systems
 * - Container orchestration (K8s liveness probes)
 */
export async function GET() {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: "ok" },
      memory: {
        status: "ok",
        heapUsedMB: 0,
        heapTotalMB: 0,
        rssMB: 0,
      },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.select({ ping: sql`1` }).from(sql`(SELECT 1)`);
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  // Check memory usage
  if (typeof process !== "undefined" && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);

    health.checks.memory = {
      status: heapUsedMB > 500 ? "warning" : "ok",
      heapUsedMB,
      heapTotalMB,
      rssMB,
    };

    // Mark as degraded if memory is high but not critical
    if (heapUsedMB > 500 && health.status === "healthy") {
      health.status = "degraded";
    }
  }

  // Return appropriate HTTP status based on health
  const httpStatus = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, { status: httpStatus });
}

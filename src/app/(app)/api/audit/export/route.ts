import { db } from "@/db";
import { auditLogs, type entityTypes } from "@/db/schema";
import { requirePermission } from "@/lib/session";
import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("system:settings");

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];

    if (action && action !== "all") {
      conditions.push(eq(auditLogs.action, action));
    }

    if (entityType && entityType !== "all") {
      conditions.push(
        eq(auditLogs.entityType, entityType as (typeof entityTypes)[number])
      );
    }

    if (userId && userId !== "all") {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (search) {
      conditions.push(
        or(
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.details, `%${search}%`)
        )
      );
    }

    if (from) {
      const fromDate = new Date(from);
      conditions.push(gte(auditLogs.createdAt, fromDate));
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      limit: 10000, // Cap export at 10k rows
    });

    // Generate CSV
    const headers = [
      "ID",
      "Timestamp",
      "Action",
      "Entity Type",
      "Entity ID",
      "User Name",
      "User Employee ID",
      "Details",
    ];

    const rows = logs.map((log) => [
      log.id.toString(),
      log.createdAt.toISOString(),
      log.action,
      log.entityType,
      log.entityId.toString(),
      log.user?.name || "System",
      log.user?.employeeId || "",
      log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const filename = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export audit logs:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}

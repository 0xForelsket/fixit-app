import { db } from "@/db";
import {
  type WorkOrderPriority,
  type WorkOrderStatus,
  workOrders,
} from "@/db/schema";
import { ApiErrors } from "@/lib/api-error";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { apiLogger, generateRequestId } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDateRangeStart } from "@/lib/utils/date-filters";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentUser();

    if (!user || !userHasPermission(user, PERMISSIONS.REPORTS_EXPORT)) {
      return ApiErrors.unauthorized(requestId);
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const dateRange = searchParams.get("dateRange");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(workOrders.status, status as WorkOrderStatus));
    }

    if (priority && priority !== "all") {
      conditions.push(eq(workOrders.priority, priority as WorkOrderPriority));
    }

    if (search) {
      conditions.push(
        or(
          ilike(workOrders.title, `%${search}%`),
          ilike(workOrders.description, `%${search}%`)
        )
      );
    }

    if (dateRange && dateRange !== "all") {
      const dateStart = getDateRangeStart(dateRange);
      if (dateStart) {
        conditions.push(gte(workOrders.createdAt, dateStart));
      }
    } else {
      if (from) {
        const fromDate = new Date(from);
        conditions.push(gte(workOrders.createdAt, fromDate));
      }

      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(workOrders.createdAt, toDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const workOrdersList = await db.query.workOrders.findMany({
      where: whereClause,
      orderBy: [desc(workOrders.createdAt)],
      with: {
        equipment: { with: { location: true } },
        reportedBy: true,
        assignedTo: true,
      },
    });

    // Build CSV content
    const headers = [
      "ID",
      "Title",
      "Description",
      "Equipment",
      "Location",
      "Type",
      "Priority",
      "Status",
      "Reported By",
      "Assigned To",
      "Created At",
      "Resolved At",
      "Resolution Notes",
    ];

    const rows = workOrdersList.map((workOrder) => [
      workOrder.id,
      escapeCSV(workOrder.title),
      escapeCSV(workOrder.description),
      escapeCSV(workOrder.equipment?.name || ""),
      escapeCSV(workOrder.equipment?.location?.name || ""),
      workOrder.type,
      workOrder.priority,
      workOrder.status,
      escapeCSV(workOrder.reportedBy?.name || ""),
      escapeCSV(workOrder.assignedTo?.name || ""),
      formatDate(workOrder.createdAt),
      workOrder.resolvedAt ? formatDate(workOrder.resolvedAt) : "",
      escapeCSV(workOrder.resolutionNotes || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="work-order-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    apiLogger.error({ requestId, error }, "Failed to export work orders");
    return ApiErrors.internal(error, requestId);
  }
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return d.toISOString().replace("T", " ").split(".")[0];
}

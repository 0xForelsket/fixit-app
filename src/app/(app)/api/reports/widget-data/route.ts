import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import {
  getInventoryChartData,
  getLaborChartData,
  getStatsSummary,
  getWorkOrderChartData,
} from "@/lib/services/report-widgets";
import { getCurrentUser } from "@/lib/session";
import { reportWidgetDataQuerySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userHasPermission(user, PERMISSIONS.REPORTS_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = reportWidgetDataQuerySchema.safeParse({
    widgetType: url.searchParams.get("widgetType"),
    dataSource: url.searchParams.get("dataSource"),
    startDate: url.searchParams.get("startDate") || undefined,
    endDate: url.searchParams.get("endDate") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid widget query" },
      { status: 400 }
    );
  }

  const { widgetType, dataSource, startDate, endDate } = parsed.data;
  const dateRange =
    startDate || endDate
      ? {
          startDate,
          endDate,
        }
      : undefined;

  if (widgetType === "stats_summary") {
    const summaryData = await getStatsSummary(dataSource, dateRange);
    return NextResponse.json({ summaryData });
  }

  if (dataSource === "work_orders") {
    const chartData = await getWorkOrderChartData(dateRange);
    return NextResponse.json({ chartData });
  }

  if (dataSource === "inventory") {
    const chartData = await getInventoryChartData();
    return NextResponse.json({ chartData });
  }

  const chartData = await getLaborChartData(dateRange);
  return NextResponse.json({ chartData });
}

import { ReportsFilters } from "@/components/reports/reports-filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { SortHeader } from "@/components/ui/sort-header";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  type WorkOrderPriority,
  type WorkOrderStatus,
  equipment,
  locations,
  users,
  workOrders,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { getDateRangeStart } from "@/lib/utils/date-filters";
import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
} from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Inbox,
  MapPin,
  Plus,
  Timer,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  dateRange?: string;
  from?: string;
  to?: string;
  page?: string;
  sort?:
    | "id"
    | "title"
    | "status"
    | "priority"
    | "createdAt"
    | "resolvedAt"
    | "equipment"
    | "location"
    | "reportedBy"
    | "assignedTo";
  dir?: "asc" | "desc";
};

const PAGE_SIZE = 25;

async function getWorkOrders(params: SearchParams) {
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  // Aliases for joins
  const reportedBy = aliasedTable(users, "reported_by");
  const assignedTo = aliasedTable(users, "assigned_to");

  // Build conditions
  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(workOrders.status, params.status as WorkOrderStatus));
  }

  if (params.priority && params.priority !== "all") {
    conditions.push(
      eq(workOrders.priority, params.priority as WorkOrderPriority)
    );
  }

  if (params.search) {
    conditions.push(
      or(
        like(workOrders.title, `%${params.search}%`),
        like(workOrders.description, `%${params.search}%`)
      )
    );
  }

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(workOrders.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(workOrders.createdAt, toDate));
  }

  if (
    !params.from &&
    !params.to &&
    params.dateRange &&
    params.dateRange !== "all"
  ) {
    const dateStart = getDateRangeStart(params.dateRange);
    if (dateStart) {
      conditions.push(gte(workOrders.createdAt, dateStart));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query 1: Get sorted IDs
  const idQuery = db
    .select({
      id: workOrders.id,
      displayId: workOrders.displayId,
      // We need to select these to sort by them in some SQL dialects,
      // but mostly we just need the IDs in the correct order.
    })
    .from(workOrders)
    .leftJoin(equipment, eq(workOrders.equipmentId, equipment.id))
    .leftJoin(locations, eq(equipment.locationId, locations.id))
    .leftJoin(reportedBy, eq(workOrders.reportedById, reportedBy.id))
    .leftJoin(assignedTo, eq(workOrders.assignedToId, assignedTo.id))
    .where(whereClause);

  // Apply Sort
  if (params.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "id":
        idQuery.orderBy(direction(workOrders.displayId));
        break;
      case "title":
        idQuery.orderBy(direction(workOrders.title));
        break;
      case "status":
        idQuery.orderBy(direction(workOrders.status));
        break;
      case "priority":
        idQuery.orderBy(direction(workOrders.priority));
        break;
      case "createdAt":
        idQuery.orderBy(direction(workOrders.createdAt));
        break;
      case "resolvedAt":
        idQuery.orderBy(direction(workOrders.resolvedAt));
        break;
      case "equipment":
        idQuery.orderBy(direction(equipment.name));
        break;
      case "location":
        idQuery.orderBy(direction(locations.name));
        break;
      case "reportedBy":
        idQuery.orderBy(direction(reportedBy.name));
        break;
      case "assignedTo":
        idQuery.orderBy(direction(assignedTo.name));
        break;
    }
  } else {
    // Default sort
    idQuery.orderBy(desc(workOrders.createdAt));
  }

  // Get total count (separate query to avoid pagination)
  const [totalResult] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(whereClause);

  // Apply pagination to ID query
  const sortedIds = await idQuery.limit(PAGE_SIZE).offset(offset);

  if (sortedIds.length === 0) {
    return {
      workOrders: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  const ids = sortedIds.map((row) => row.id);

  // Query 2: Fetch full details for these IDs
  const workOrdersList = await db.query.workOrders.findMany({
    where: inArray(workOrders.id, ids),
    with: {
      equipment: { with: { location: true } },
      reportedBy: true,
      assignedTo: true,
    },
  });

  // Re-sort in memory because WHERE IN (...) does not guarantee order
  const sortedWorkOrders = workOrdersList.sort((a, b) => {
    return ids.indexOf(a.id) - ids.indexOf(b.id);
  });

  return {
    workOrders: sortedWorkOrders,
    total: totalResult.count,
    page,
    totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
  };
}

async function getStats(params: SearchParams) {
  const conditions = [];

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(workOrders.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(workOrders.createdAt, toDate));
  }

  if (
    !params.from &&
    !params.to &&
    params.dateRange &&
    params.dateRange !== "all"
  ) {
    const dateStart = getDateRangeStart(params.dateRange);
    if (dateStart) {
      conditions.push(gte(workOrders.createdAt, dateStart));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allWorkOrders = await db.query.workOrders.findMany({
    where: whereClause,
  });

  const resolved = allWorkOrders.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  );
  const avgResolutionTime =
    resolved.length > 0
      ? resolved.reduce((sum, t) => {
          if (t.resolvedAt && t.createdAt) {
            return (
              sum +
              (new Date(t.resolvedAt).getTime() -
                new Date(t.createdAt).getTime())
            );
          }
          return sum;
        }, 0) /
        resolved.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  return {
    total: allWorkOrders.length,
    open: allWorkOrders.filter((t) => t.status === "open").length,
    resolved: resolved.length,
    critical: allWorkOrders.filter((t) => t.priority === "critical").length,
    avgResolutionHours: Math.round(avgResolutionTime * 10) / 10,
  };
}

function buildSearchParams(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "all") {
      searchParams.set(key, value);
    }
  }
  return searchParams.toString();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const params = await searchParams;
  const {
    workOrders: workOrdersList,
    total,
    page,
    totalPages,
  } = await getWorkOrders(params);
  const stats = await getStats(params);

  const hasFilters =
    (params.status && params.status !== "all") ||
    (params.priority && params.priority !== "all") ||
    (params.dateRange && params.dateRange !== "all") ||
    params.search;

  // Build CSV export URL
  const csvParams = new URLSearchParams();
  if (params.status && params.status !== "all")
    csvParams.set("status", params.status);
  if (params.priority && params.priority !== "all")
    csvParams.set("priority", params.priority);
  if (params.dateRange && params.dateRange !== "all")
    csvParams.set("dateRange", params.dateRange);
  if (params.from) csvParams.set("from", params.from);
  if (params.to) csvParams.set("to", params.to);
  if (params.search) csvParams.set("search", params.search);
  const csvUrl = `/api/reports/export?${csvParams.toString()}`;

  return (
    <PageLayout
      id="reports-page"
      title={t("title")}
      subtitle={t("subtitle")}
      description={`${total} ${t("workOrdersProcessed")}${hasFilters ? ` • ${t("filteredResults")}` : ""}`}
      bgSymbol="RE"
      headerActions={
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <Link href="/reports/builder">
              <Plus className="mr-2 h-4 w-4" />
              {t("newReport")}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <a href={csvUrl} download="work-order-report.csv">
              <Download className="mr-2 h-4 w-4" />
              {t("exportCsv")}
            </a>
          </Button>
        </div>
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: t("totalWorkOrders"),
              value: stats.total,
              icon: FileText,
              variant: "default",
            },
            {
              label: t("open"),
              value: stats.open,
              icon: Inbox,
              variant: "warning",
            },
            {
              label: t("resolved"),
              value: stats.resolved,
              icon: CheckCircle2,
              variant: "success",
            },
            {
              label: t("critical"),
              value: stats.critical,
              icon: AlertTriangle,
              variant: "danger",
            },
            {
              label: t("avgResolution"),
              value: `${stats.avgResolutionHours}h`,
              icon: Timer,
              variant: "default",
            },
          ]}
        />
      }
      filters={
        <ReportsFilters
          searchParams={params}
          hasActiveFilters={
            !!(
              (params.status && params.status !== "all") ||
              (params.priority && params.priority !== "all") ||
              (params.dateRange && params.dateRange !== "all") ||
              params.search ||
              params.from ||
              params.to
            )
          }
        />
      }
    >
      {workOrdersList.length === 0 ? (
        <EmptyState
          title={t("noWorkOrdersFound")}
          description={t("noWorkOrdersDescription")}
          icon={FileText}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <SortHeader
                  label={t("id")}
                  field="id"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label={t("titleColumn")}
                  field="title"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label={t("equipment")}
                  field="equipment"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell"
                />
                <SortHeader
                  label={t("location")}
                  field="location"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell"
                />
                <SortHeader
                  label={t("status")}
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label={t("priority")}
                  field="priority"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell"
                />
                <SortHeader
                  label={t("reportedBy")}
                  field="reportedBy"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell"
                />
                <SortHeader
                  label={t("assignedTo")}
                  field="assignedTo"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell"
                />
                <SortHeader
                  label={t("created")}
                  field="createdAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label={t("resolvedDate")}
                  field="resolvedAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell"
                />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {workOrdersList.map((workOrder, index) => (
                <WorkOrderRow
                  key={workOrder.id}
                  workOrder={workOrder}
                  index={index}
                  unassignedLabel={t("unassigned")}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("showing", {
              start: (page - 1) * PAGE_SIZE + 1,
              end: Math.min(page * PAGE_SIZE, total),
              total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
              className="font-bold"
            >
              {page > 1 ? (
                <Link
                  href={`/reports?${buildSearchParams({ ...params, page: String(page - 1) })}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("previous")}
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {tCommon("previous")}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
              className="font-bold"
            >
              {page < totalPages ? (
                <Link
                  href={`/reports?${buildSearchParams({ ...params, page: String(page + 1) })}`}
                >
                  {tCommon("next")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                 {tCommon("next")} <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

interface WorkOrderWithRelations {
  id: string;
  displayId: number;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  resolvedAt: Date | null;
  equipment?: { name: string; location?: { name: string } | null } | null;
  reportedBy?: { name: string } | null;
  assignedTo?: { name: string } | null;
}

function WorkOrderRow({
  workOrder,
  index,
  unassignedLabel,
}: {
  workOrder: WorkOrderWithRelations;
  index: number;
  unassignedLabel: string;
}) {
  const staggerClass =
    index < 5
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";

  return (
    <TableRow
      className={cn(
        "hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-1",
        staggerClass
      )}
    >
      <TableCell className="p-5">
        <Link
          href={`/maintenance/work-orders/${workOrder.id}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          #{workOrder.displayId}
        </Link>
      </TableCell>
      <TableCell className="p-5">
        <span className="font-bold text-foreground line-clamp-1">
          {workOrder.title}
        </span>
      </TableCell>
      <TableCell className="p-5 hidden md:table-cell text-muted-foreground text-sm font-medium">
        {workOrder.equipment?.name || "—"}
      </TableCell>
      <TableCell className="p-5 hidden lg:table-cell">
        {workOrder.equipment?.location?.name ? (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border w-fit">
            <MapPin className="h-3 w-3" />
            {workOrder.equipment.location.name}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="p-5">
        <StatusBadge status={workOrder.status} />
      </TableCell>
      <TableCell className="p-5 hidden sm:table-cell">
        <StatusBadge status={workOrder.priority} />
      </TableCell>
      <TableCell className="p-5 hidden xl:table-cell text-muted-foreground text-sm">
        {workOrder.reportedBy?.name || "—"}
      </TableCell>
      <TableCell className="p-5 hidden xl:table-cell text-muted-foreground text-sm">
        {workOrder.assignedTo?.name || unassignedLabel}
      </TableCell>
      <TableCell className="p-5 text-muted-foreground text-sm font-mono">
        {new Date(workOrder.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="p-5 hidden lg:table-cell text-muted-foreground text-sm font-mono">
        {workOrder.resolvedAt
          ? new Date(workOrder.resolvedAt).toLocaleDateString()
          : "—"}
      </TableCell>
    </TableRow>
  );
}

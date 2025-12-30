import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SortHeader } from "@/components/ui/sort-header";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import {
  equipment,
  locations,
  users,
  type WorkOrderPriority,
  type WorkOrderStatus,
  workOrders,
} from "@/db/schema";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Inbox,
  MapPin,
  Timer,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
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

  if (params.from) {
    const fromDate = new Date(params.from);
    conditions.push(gte(workOrders.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(workOrders.createdAt, toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query 1: Get sorted IDs
  const idQuery = db
    .select({
      id: workOrders.id,
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
        idQuery.orderBy(direction(workOrders.id));
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
  const params = await searchParams;
  const {
    workOrders: workOrdersList,
    total,
    page,
    totalPages,
  } = await getWorkOrders(params);
  const stats = await getStats(params);

  const hasFilters =
    params.status || params.priority || params.from || params.to;

  // Build CSV export URL
  const csvParams = new URLSearchParams();
  if (params.status && params.status !== "all")
    csvParams.set("status", params.status);
  if (params.priority && params.priority !== "all")
    csvParams.set("priority", params.priority);
  if (params.from) csvParams.set("from", params.from);
  if (params.to) csvParams.set("to", params.to);
  const csvUrl = `/api/reports/export?${csvParams.toString()}`;

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="System Reports"
        subtitle="Performance Analytics"
        description={`${total} WORK ORDERS PROCESSED${hasFilters ? " • FILTERED RESULTS" : ""}`}
        bgSymbol="RE"
        actions={
          <Button
            asChild
            variant="outline"
            className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
          >
            <a href={csvUrl} download="work-order-report.csv">
              <Download className="mr-2 h-4 w-4" />
              EXPORT CSV
            </a>
          </Button>
        }
      />

      {/* Summary Stats */}
      <StatsTicker
        stats={[
          {
            label: "Total Work Orders",
            value: stats.total,
            icon: FileText,
            variant: "default",
          },
          {
            label: "Open",
            value: stats.open,
            icon: Inbox,
            variant: "warning",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle2,
            variant: "success",
          },
          {
            label: "Critical",
            value: stats.critical,
            icon: AlertTriangle,
            variant: "danger",
          },
          {
            label: "Avg Resolution",
            value: `${stats.avgResolutionHours}h`,
            icon: Timer,
            variant: "default",
          },
        ]}
      />

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <form
          action="/reports"
          method="get"
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="from-date"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              From Date
            </label>
            <input
              type="date"
              id="from-date"
              name="from"
              defaultValue={params.from}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="to-date"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              To Date
            </label>
            <input
              type="date"
              id="to-date"
              name="to"
              defaultValue={params.to}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="status-filter"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={params.status || "all"}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="priority-filter"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              Priority
            </label>
            <select
              id="priority-filter"
              name="priority"
              defaultValue={params.priority || "all"}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Button
            type="submit"
            className="rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              asChild
              className="font-bold text-muted-foreground hover:text-foreground"
            >
              <Link href="/reports">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Work Orders Table */}
      {workOrdersList.length === 0 ? (
        <EmptyState
          title="No work orders found"
          description="Try adjusting your date range or filters to find what you're looking for."
          icon={FileText}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <SortHeader
                  label="ID"
                  field="id"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Title"
                  field="title"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Equipment"
                  field="equipment"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell"
                />
                <SortHeader
                  label="Location"
                  field="location"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell"
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Priority"
                  field="priority"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell"
                />
                <SortHeader
                  label="Reported By"
                  field="reportedBy"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell"
                />
                <SortHeader
                  label="Assigned To"
                  field="assignedTo"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell"
                />
                <SortHeader
                  label="Created"
                  field="createdAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Resolved"
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
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total}
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
                  <ArrowLeft className="mr-2 h-4 w-4" /> PREVIOUS
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> PREVIOUS
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
                  NEXT <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  NEXT <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

interface WorkOrderWithRelations {
  id: number;
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
}: {
  workOrder: WorkOrderWithRelations;
  index: number;
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
          #{workOrder.id}
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
        {workOrder.assignedTo?.name || "Unassigned"}
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

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
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
  type WorkOrderPriority,
  type WorkOrderStatus,
  workOrders,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Inbox,
  Timer,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  page?: string;
};

const PAGE_SIZE = 25;

async function getWorkOrders(params: SearchParams) {
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

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

  const workOrdersList = await db.query.workOrders.findMany({
    where: whereClause,
    limit: PAGE_SIZE,
    offset,
    orderBy: [desc(workOrders.createdAt)],
    with: {
      equipment: { with: { location: true } },
      reportedBy: true,
      assignedTo: true,
    },
  });

  const [totalResult] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(whereClause);

  return {
    workOrders: workOrdersList,
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="System"
        subtitle="Reports"
        description={`${total} WORK ORDERS PROCESSED${hasFilters ? " • FILTERED RESULTS" : ""}`}
        bgSymbol="RE"
        actions={
          <Button asChild>
            <a href={csvUrl} download="work-order-report.csv">
              <Download className="mr-2 h-4 w-4" />
              EXPORT CSV
            </a>
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatsCard
          title="Total Work Orders"
          value={stats.total}
          icon={FileText}
          variant="primary"
        />
        <StatsCard
          title="Open"
          value={stats.open}
          icon={Inbox}
          variant="warning"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          variant="danger"
        />
        <StatsCard
          title="Avg Resolution"
          value={`${stats.avgResolutionHours}h`}
          icon={Timer}
          variant="secondary"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white p-4">
        <form
          action="/reports"
          method="get"
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="from-date"
              className="text-xs font-medium text-muted-foreground"
            >
              From Date
            </label>
            <input
              type="date"
              id="from-date"
              name="from"
              defaultValue={params.from}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="to-date"
              className="text-xs font-medium text-muted-foreground"
            >
              To Date
            </label>
            <input
              type="date"
              id="to-date"
              name="to"
              defaultValue={params.to}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={params.status || "all"}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
              className="text-xs font-medium text-muted-foreground"
            >
              Priority
            </label>
            <select
              id="priority-filter"
              name="priority"
              defaultValue={params.priority || "all"}
              className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Button type="submit">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          {hasFilters && (
            <Button variant="ghost" asChild>
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
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b text-left font-medium text-muted-foreground hover:bg-transparent">
                <TableHead className="p-3">ID</TableHead>
                <TableHead className="p-3">Title</TableHead>
                <TableHead className="p-3 hidden md:table-cell">
                  Equipment
                </TableHead>
                <TableHead className="p-3 hidden lg:table-cell">
                  Location
                </TableHead>
                <TableHead className="p-3">Status</TableHead>
                <TableHead className="p-3 hidden sm:table-cell">
                  Priority
                </TableHead>
                <TableHead className="p-3 hidden xl:table-cell">
                  Reported By
                </TableHead>
                <TableHead className="p-3 hidden xl:table-cell">
                  Assigned To
                </TableHead>
                <TableHead className="p-3">Created</TableHead>
                <TableHead className="p-3 hidden lg:table-cell">
                  Resolved
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
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
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link
                  href={`/reports?${buildSearchParams({ ...params, page: String(page - 1) })}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link
                  href={`/reports?${buildSearchParams({ ...params, page: String(page + 1) })}`}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
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
        "hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-bottom-1",
        staggerClass
      )}
    >
      <TableCell className="p-3">
        <Link
          href={`/maintenance/work-orders/${workOrder.id}`}
          className="font-mono text-xs text-primary-600 hover:underline"
        >
          #{workOrder.id}
        </Link>
      </TableCell>
      <TableCell className="p-3">
        <span className="line-clamp-1">{workOrder.title}</span>
      </TableCell>
      <TableCell className="p-3 hidden md:table-cell text-muted-foreground">
        {workOrder.equipment?.name || "—"}
      </TableCell>
      <TableCell className="p-3 hidden lg:table-cell text-muted-foreground">
        {workOrder.equipment?.location?.name || "—"}
      </TableCell>
      <TableCell className="p-3">
        <StatusBadge status={workOrder.status} />
      </TableCell>
      <TableCell className="p-3 hidden sm:table-cell">
        <StatusBadge status={workOrder.priority} />
      </TableCell>
      <TableCell className="p-3 hidden xl:table-cell text-muted-foreground">
        {workOrder.reportedBy?.name || "—"}
      </TableCell>
      <TableCell className="p-3 hidden xl:table-cell text-muted-foreground">
        {workOrder.assignedTo?.name || "Unassigned"}
      </TableCell>
      <TableCell className="p-3 text-muted-foreground">
        {new Date(workOrder.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="p-3 hidden lg:table-cell text-muted-foreground">
        {workOrder.resolvedAt
          ? new Date(workOrder.resolvedAt).toLocaleDateString()
          : "—"}
      </TableCell>
    </TableRow>
  );
}

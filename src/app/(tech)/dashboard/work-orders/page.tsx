import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import type { Equipment, WorkOrder, User } from "@/db/schema";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, count, eq, ilike, lt, or } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Filter,
  Inbox,
  Search,
  Timer,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";

type WorkOrderWithRelations = WorkOrder & {
  equipment: Equipment | null;
  reportedBy: User | null;
  assignedTo: User | null;
};

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  page?: string;
  assigned?: string;
  overdue?: string;
};

const PAGE_SIZE = 10;

async function getWorkOrders(params: SearchParams, userId?: number) {
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(
      eq(
        workOrders.status,
        params.status as "open" | "in_progress" | "resolved" | "closed"
      )
    );
  }

  if (params.priority && params.priority !== "all") {
    conditions.push(
      eq(
        workOrders.priority,
        params.priority as "low" | "medium" | "high" | "critical"
      )
    );
  }

  if (params.search) {
    conditions.push(
      or(
        ilike(workOrders.title, `%${params.search}%`),
        ilike(workOrders.description, `%${params.search}%`)
      )
    );
  }

  if (params.assigned === "me" && userId) {
    conditions.push(eq(workOrders.assignedToId, userId));
  }

  if (params.overdue === "true") {
    conditions.push(lt(workOrders.dueBy, new Date()));
    // Only show open or in_progress work orders when filtering by overdue
    if (!params.status) {
      conditions.push(
        or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress"))
      );
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const workOrdersList = await db.query.workOrders.findMany({
    where: whereClause,
    limit: PAGE_SIZE,
    offset,
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    with: {
      equipment: true,
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

async function getStats() {
  const [openWorkOrders] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "open"));

  const [inProgressWorkOrders] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "in_progress"));

  const [resolvedWorkOrders] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "resolved"));

  const [criticalWorkOrders] = await db
    .select({ count: count() })
    .from(workOrders)
    .where(and(eq(workOrders.priority, "critical"), eq(workOrders.status, "open")));

  return {
    open: openWorkOrders.count,
    inProgress: inProgressWorkOrders.count,
    resolved: resolvedWorkOrders.count,
    critical: criticalWorkOrders.count,
  };
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const {
    workOrders: workOrdersList,
    total,
    page,
    totalPages,
  } = await getWorkOrders(params, user?.id);
  const stats = await getStats();
  const isMyWorkOrdersView = params.assigned === "me";

  const activeFilters =
    (params.status && params.status !== "all") ||
    (params.priority && params.priority !== "all") ||
    params.search ||
    isMyWorkOrdersView ||
    params.overdue === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {params.overdue === "true"
              ? "Overdue Work Orders"
              : isMyWorkOrdersView
                ? "My Work Orders"
                : "All Work Orders"}
          </h1>
          <p className="text-muted-foreground">
            {total} total work orders • Page {page} of {totalPages || 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border-2 border-zinc-200 bg-white overflow-hidden">
            <Link
              href="/dashboard/work-orders"
              className={cn(
                "px-3 py-1.5 text-sm font-bold transition-colors",
                !isMyWorkOrdersView
                  ? "bg-primary-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              All
            </Link>
            <Link
              href="/dashboard/work-orders?assigned=me"
              className={cn(
                "px-3 py-1.5 text-sm font-bold transition-colors flex items-center gap-1.5",
                isMyWorkOrdersView
                  ? "bg-primary-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              <UserIcon className="h-3.5 w-3.5" />
              Mine
            </Link>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatFilterCard
          title="Open"
          value={stats.open}
          icon={Inbox}
          color="text-primary-600"
          bg="bg-primary-50"
          href="?status=open"
          active={params.status === "open"}
        />
        <StatFilterCard
          title="In Progress"
          value={stats.inProgress}
          icon={Timer}
          color="text-amber-600"
          bg="bg-amber-50"
          href="?status=in_progress"
          active={params.status === "in_progress"}
        />
        <StatFilterCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          href="?status=resolved"
          active={params.status === "resolved"}
        />
        <StatFilterCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="text-rose-600"
          bg="bg-rose-50"
          href="?priority=critical"
          active={params.priority === "critical"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex-1 min-w-[200px]"
          action="/dashboard/work-orders"
          method="get"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search work orders..."
              defaultValue={params.search}
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
            {params.priority && (
              <input type="hidden" name="priority" value={params.priority} />
            )}
            {params.assigned && (
              <input type="hidden" name="assigned" value={params.assigned} />
            )}
            {params.overdue && (
              <input type="hidden" name="overdue" value={params.overdue} />
            )}
          </div>
        </form>

        <FilterSelect
          name="status"
          value={params.status || "all"}
          options={[
            { value: "all", label: "All Status" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
          ]}
          searchParams={params}
        />

        <FilterSelect
          name="priority"
          value={params.priority || "all"}
          options={[
            { value: "all", label: "All Priority" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          searchParams={params}
        />

        {activeFilters && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/work-orders">
              <X className="mr-1 h-4 w-4" />
              Clear
            </Link>
          </Button>
        )}
      </div>

      {/* Work Orders List */}
      {workOrdersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 border shadow-inner">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No work orders found</h3>
          <p className="text-sm text-muted-foreground">
            {activeFilters
              ? "Try adjusting your filters"
              : "No work orders have been created yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b bg-slate-50">
                <tr className="text-left text-sm font-medium text-muted-foreground">
                  <th className="p-4">ID</th>
                  <th className="p-4">Work Order</th>
                  <th className="p-4 hidden md:table-cell">Equipment</th>
                  <th className="p-4 hidden lg:table-cell">Status</th>
                  <th className="p-4 hidden lg:table-cell">Priority</th>
                  <th className="p-4 hidden xl:table-cell">Assigned To</th>
                  <th className="p-4 hidden sm:table-cell">Created</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {workOrdersList.map((workOrder) => (
                  <WorkOrderRow key={workOrder.id} workOrder={workOrder} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {workOrdersList.map((workOrder) => (
              <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-10 px-4 font-bold rounded-lg border-2"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link
                  href={`/dashboard/work-orders?${buildSearchParams({ ...params, page: String(page - 1) })}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Prev
                </Link>
              ) : (
                <span>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Prev
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-10 px-4 font-bold rounded-lg border-2"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link
                  href={`/dashboard/work-orders?${buildSearchParams({ ...params, page: String(page + 1) })}`}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <span>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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

function StatFilterCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  href,
  active,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={active ? "/dashboard/work-orders" : href}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-xl border p-3 sm:p-4 transition-all hover:shadow-md bg-white",
        active
          ? "ring-2 ring-primary-500 border-primary-300 shadow-inner"
          : "shadow-sm border-zinc-200"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className={cn("text-lg sm:text-2xl font-black", color)}>{value}</p>
      </div>
    </Link>
  );
}

function FilterSelect({
  name,
  value,
  options,
  searchParams,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  searchParams: SearchParams;
}) {
  const buildUrl = (newValue: string) => {
    const params: Record<string, string | undefined> = {
      ...searchParams,
      [name]: newValue === "all" ? undefined : newValue,
      page: undefined,
    };
    const queryString = buildSearchParams(params);
    return `/dashboard/work-orders${queryString ? `?${queryString}` : ""}`;
  };

  const currentOption =
    options.find((o) => o.value === value)?.label || options[0].label;

  return (
    <div className="relative group flex-1 sm:flex-none">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 appearance-none rounded-lg border-2 bg-white py-2 pl-3 pr-10 text-sm font-bold hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
      >
        <span className="truncate">{currentOption}</span>
        <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </button>
      {/* Dropdown */}
      <div className="hidden group-focus-within:block group-hover:block absolute top-full left-0 mt-1 z-20 min-w-full sm:min-w-[180px] rounded-xl border-2 bg-white shadow-xl py-1">
        {options.map((option) => (
          <Link
            key={option.value}
            href={buildUrl(option.value)}
            className={cn(
              "block px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors",
              option.value === value &&
                "bg-primary-50 text-primary-700 font-bold"
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function WorkOrderCard({ workOrder }: { workOrder: WorkOrderWithRelations }) {
  const statusConfig = getStatusConfig(workOrder.status);
  const priorityConfig = getPriorityConfig(workOrder.priority);

  return (
    <Link
      href={`/dashboard/work-orders/${workOrder.id}`}
      className={cn(
        "block rounded-2xl border-2 bg-white p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]",
        workOrder.priority === "critical"
          ? "border-rose-200 shadow-rose-100/50"
          : "border-zinc-200"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-zinc-50 border-zinc-300 px-1.5 py-0"
        >
          #{workOrder.id}
        </Badge>
        <span
          className={cn(
            "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
            statusConfig.bg,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      <h3 className="font-bold text-lg leading-tight mb-1 text-zinc-900 line-clamp-2">
        {workOrder.title}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center rounded-md border-2 px-1.5 py-0 text-[10px] font-black uppercase tracking-tighter",
            priorityConfig.bg,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </span>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {formatRelativeTime(workOrder.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-6 w-6 rounded-full bg-zinc-100 border flex items-center justify-center text-[10px] font-bold shrink-0">
            {workOrder.assignedTo?.name?.[0] || "U"}
          </div>
          <span className="text-xs font-semibold truncate text-zinc-600">
            {workOrder.assignedTo?.name || "Unassigned"}
          </span>
        </div>
        <div className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
          Details
          <ArrowRight className="inline-block ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { color: string; bg: string; label: string }> =
    {
      open: {
        color: "text-primary-700",
        bg: "bg-primary-50 border-primary-200",
        label: "Open",
      },
      in_progress: {
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        label: "In Progress",
      },
      resolved: {
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        label: "Resolved",
      },
      closed: {
        color: "text-slate-700",
        bg: "bg-slate-50 border-slate-200",
        label: "Closed",
      },
    };
  return configs[status] || configs.open;
}

function getPriorityConfig(priority: string) {
  const configs: Record<string, { color: string; bg: string; label: string }> =
    {
      low: {
        color: "text-slate-700",
        bg: "bg-slate-50 border-slate-200",
        label: "Low",
      },
      medium: {
        color: "text-primary-700",
        bg: "bg-primary-50 border-primary-200",
        label: "Medium",
      },
      high: {
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        label: "High",
      },
      critical: {
        color: "text-rose-700",
        bg: "bg-rose-50 border-rose-200",
        label: "Critical",
      },
    };
  return configs[priority] || configs.medium;
}

function WorkOrderRow({ workOrder }: { workOrder: WorkOrderWithRelations }) {
  const status = getStatusConfig(workOrder.status);
  const priority = getPriorityConfig(workOrder.priority);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-4">
        <Badge variant="outline" className="font-mono text-xs">
          #{workOrder.id}
        </Badge>
      </td>
      <td className="p-4">
        <div className="space-y-1">
          <Link
            href={`/dashboard/work-orders/${workOrder.id}`}
            className="font-medium hover:text-primary-600 hover:underline"
          >
            {workOrder.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {workOrder.description}
          </p>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm">{workOrder.equipment?.name || "—"}</span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            status.bg,
            status.color
          )}
        >
          {status.label}
        </span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>
      </td>
      <td className="p-4 hidden xl:table-cell">
        <span className="text-sm">
          {workOrder.assignedTo?.name || (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </span>
      </td>
      <td className="p-4 hidden sm:table-cell">
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(workOrder.createdAt)}
        </span>
      </td>
      <td className="p-4 text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/work-orders/${workOrder.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { WorkOrderList } from "@/components/work-orders/work-order-list";
import { db } from "@/db";
import { roles, users, workOrders } from "@/db/schema";
import { type SessionUser, getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  type SQL,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lt,
  or,
} from "drizzle-orm";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Plus,
  Search,
  User as UserIcon,
  X,
} from "lucide-react";
import { AlertTriangle, CheckCircle2, Inbox, Timer } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  page?: string;
  assigned?: string;
  overdue?: string;
  sort?: "id" | "title" | "priority" | "status" | "createdAt" | "dueBy";
  dir?: "asc" | "desc";
};

const PAGE_SIZE = 10;

async function getWorkOrders(params: SearchParams, user: SessionUser | null) {
  const userId = user?.id;
  const departmentId = user?.departmentId;
  const page = Number.parseInt(params.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  const conditions = [];

  // Data Isolation: Technicians only see their department's work orders
  if (user?.roleName === "tech" && departmentId) {
    conditions.push(eq(workOrders.departmentId, departmentId));
  }

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

  // Determine sort order
  let orderBy = [desc(workOrders.createdAt)]; // Default
  if (params.sort) {
    const sortField = {
      id: workOrders.id,
      title: workOrders.title,
      priority: workOrders.priority,
      status: workOrders.status,
      createdAt: workOrders.createdAt,
      dueBy: workOrders.dueBy,
    }[params.sort];

    if (sortField) {
      orderBy = [params.dir === "asc" ? asc(sortField) : desc(sortField)];
    }
  }

  const workOrdersList = await db.query.workOrders.findMany({
    where: whereClause,
    limit: PAGE_SIZE,
    offset,
    orderBy: orderBy,
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
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

async function getTechnicians() {
  const techRole = await db.query.roles.findFirst({
    where: eq(roles.name, "tech"),
  });

  if (!techRole) return [];

  const techs = await db.query.users.findMany({
    where: and(eq(users.roleId, techRole.id), eq(users.isActive, true)),
    columns: { id: true, name: true },
    orderBy: [asc(users.name)],
  });

  return techs;
}

async function getStats(user: SessionUser | null) {
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";

  const runCountQuery = async (...extraConditions: (SQL | undefined)[]) => {
    const conditions = extraConditions.filter((c): c is SQL => c !== undefined);

    if (isTech && departmentId) {
      conditions.push(eq(workOrders.departmentId, departmentId));
    }

    const [result] = await db
      .select({ count: count() })
      .from(workOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result?.count || 0;
  };

  const openCount = await runCountQuery(eq(workOrders.status, "open"));

  const inProgressCount = await runCountQuery(
    eq(workOrders.status, "in_progress")
  );

  const resolvedCount = await runCountQuery(eq(workOrders.status, "resolved"));

  const criticalCount = await runCountQuery(
    eq(workOrders.priority, "critical"),
    eq(workOrders.status, "open")
  );

  return {
    open: openCount,
    inProgress: inProgressCount,
    resolved: resolvedCount,
    critical: criticalCount,
  };
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const [{ workOrders: workOrdersList, total, page, totalPages }, stats, technicians] =
    await Promise.all([
      getWorkOrders(params, user),
      getStats(user),
      getTechnicians(),
    ]);
  const isMyWorkOrdersView = params.assigned === "me";

  const activeFilters =
    (params.status && params.status !== "all") ||
    (params.priority && params.priority !== "all") ||
    params.search ||
    isMyWorkOrdersView ||
    params.overdue === "true";

  return (
    <PageLayout
      id="work-orders-page"
      title={
        params.overdue === "true"
          ? "Overdue Queue"
          : isMyWorkOrdersView
            ? "My Work Queue"
            : "Work Order Queue"
      }
      subtitle="Maintenance Operations"
      description="CENTRALIZED WORK ORDER DISPATCH AND MONITORING TERMINAL"
      bgSymbol="WQ"
      headerActions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card overflow-hidden h-9">
            <Link
              href="/maintenance/work-orders"
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center",
                !isMyWorkOrdersView
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              All
            </Link>
            <Link
              href="/maintenance/work-orders?assigned=me"
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
                isMyWorkOrdersView
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <UserIcon className="h-3 w-3" />
              Mine
            </Link>
          </div>
          <Button
            size="sm"
            className="h-9 text-[10px] font-black uppercase tracking-widest"
            asChild
          >
            <Link href="/">
              <Plus className="mr-2 h-3.5 w-3.5" />
              NEW TICKET
            </Link>
          </Button>
        </div>
      }
      stats={
        <StatsTicker
          variant="compact"
          stats={[
            {
              label: "Open",
              value: stats.open,
              icon: Inbox,
              variant: "primary",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: Timer,
              variant: "default",
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
          ]}
        />
      }
      filters={
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
          <form
            className="flex-1 relative"
            action="/maintenance/work-orders"
            method="get"
          >
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="FILTER BY TITLE, DESCRIPTION OR ASSET..."
              defaultValue={params.search}
              className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-4 text-[11px] font-bold uppercase tracking-wider focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
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
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              name="status"
              value={params.status || "all"}
              options={[
                { value: "all", label: "ANY STATUS" },
                { value: "open", label: "OPEN" },
                { value: "in_progress", label: "IN PROGRESS" },
                { value: "resolved", label: "RESOLVED" },
                { value: "closed", label: "CLOSED" },
              ]}
              searchParams={params}
            />

            <FilterSelect
              name="priority"
              value={params.priority || "all"}
              options={[
                { value: "all", label: "ANY PRIORITY" },
                { value: "critical", label: "CRITICAL" },
                { value: "high", label: "HIGH" },
                { value: "medium", label: "MEDIUM" },
                { value: "low", label: "LOW" },
              ]}
              searchParams={params}
            />

            {activeFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                asChild
              >
                <Link href="/maintenance/work-orders">
                  <X className="mr-2 h-3.5 w-3.5" />
                  RESET
                </Link>
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Work Orders List */}
      <WorkOrderList
        workOrders={workOrdersList}
        emptyMessage={
          activeFilters
            ? "Try adjusting your filters"
            : "No work orders have been created yet."
        }
        searchParams={params}
        technicians={technicians}
      />

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
                  href={`/maintenance/work-orders?${buildSearchParams({ ...params, page: String(page - 1) })}`}
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
                  href={`/maintenance/work-orders?${buildSearchParams({ ...params, page: String(page + 1) })}`}
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
    </PageLayout>
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
    return `/maintenance/work-orders${queryString ? `?${queryString}` : ""}`;
  };

  const currentOption =
    options.find((o) => o.value === value)?.label || options[0].label;

  return (
    <div className="relative group flex-1 sm:flex-none">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 appearance-none rounded-lg border border-border bg-card py-2.5 pl-3 pr-8 text-[10px] font-black uppercase tracking-wider hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all min-w-[140px]"
      >
        <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors">
          {currentOption}
        </span>
        <Filter className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </button>
      {/* Dropdown */}
      <div className="hidden group-focus-within:block group-hover:block absolute top-full left-0 mt-1 z-20 min-w-[200px] rounded-xl border border-border bg-popover shadow-xl py-1 animate-in fade-in zoom-in-95 duration-200">
        {options.map((option) => (
          <Link
            key={option.value}
            href={buildUrl(option.value)}
            className={cn(
              "block px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors",
              option.value === value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { WorkOrderFilters } from "@/components/work-orders/work-order-filters";
import { WorkOrderList } from "@/components/work-orders/work-order-list";
import { db } from "@/db";
import { roles, users, workOrders } from "@/db/schema";
import { type SessionUser, getCurrentUser } from "@/lib/session";
import { getDateRangeStart } from "@/lib/utils/date-filters";
import { and, asc, count, desc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Plus, User as UserIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Inbox, Timer } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  page?: string;
  assigned?: string;
  overdue?: string;
  dateRange?: string;
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
        like(workOrders.title, `%${params.search}%`),
        like(workOrders.description, `%${params.search}%`)
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

  if (params.dateRange && params.dateRange !== "all") {
    const dateStart = getDateRangeStart(params.dateRange);
    if (dateStart) {
      conditions.push(gte(workOrders.createdAt, dateStart));
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
  // Single query with join (N+1 optimization - was 2 queries)
  const techs = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(roles.name, "tech"), eq(users.isActive, true)))
    .orderBy(asc(users.name));

  return techs;
}

async function getStats(user: SessionUser | null) {
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";

  const conditions = [];
  if (isTech && departmentId) {
    conditions.push(eq(workOrders.departmentId, departmentId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [stats] = await db
    .select({
      open: sql<number>`count(case when ${workOrders.status} = 'open' then 1 end)`,
      inProgress: sql<number>`count(case when ${workOrders.status} = 'in_progress' then 1 end)`,
      resolved: sql<number>`count(case when ${workOrders.status} = 'resolved' then 1 end)`,
      critical: sql<number>`count(case when ${workOrders.priority} = 'critical' and ${workOrders.status} = 'open' then 1 end)`,
    })
    .from(workOrders)
    .where(where);

  return {
    open: Number(stats?.open || 0),
    inProgress: Number(stats?.inProgress || 0),
    resolved: Number(stats?.resolved || 0),
    critical: Number(stats?.critical || 0),
  };
}

function buildSearchParams(params: SearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "all") {
      query.set(key, value);
    }
  }
  return query.toString();
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const [
    { workOrders: workOrdersList, total, page, totalPages },
    stats,
    technicians,
  ] = await Promise.all([
    getWorkOrders(params, user),
    getStats(user),
    getTechnicians(),
  ]);
  const isMyWorkOrdersView = params.assigned === "me";

  const activeFilters =
    (params.status && params.status !== "all") ||
    (params.priority && params.priority !== "all") ||
    (params.dateRange && params.dateRange !== "all") ||
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
          <SegmentedControl
            selectedValue={isMyWorkOrdersView ? "me" : "all"}
            options={[
              {
                label: "All",
                value: "all",
                href: "/maintenance/work-orders",
              },
              {
                label: "Mine",
                value: "me",
                icon: <UserIcon className="h-3 w-3 shrink-0" />,
                href: "/maintenance/work-orders?assigned=me",
              },
            ]}
          />
          <Button
            size="sm"
            className="h-9 text-[10px] font-black uppercase tracking-widest"
            asChild
          >
            <Link href="/report">
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
        <WorkOrderFilters
          searchParams={params}
          hasActiveFilters={!!activeFilters}
        />
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

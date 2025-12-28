import { DashboardWorkOrderFeed } from "@/components/dashboard/dashboard-work-order-feed";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { and, eq, or, sql } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Inbox,
  MonitorCog,
  Timer,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  open: number;
  inProgress: number;
  overdue: number;
  critical: number;
}

async function getStats(
  userId?: number
): Promise<{ global: Stats; personal: Stats | null }> {
  const now = new Date();

  // Optimized global stats query
  const [globalResult] = await db
    .select({
      open: sql<number>`sum(case when ${workOrders.status} = 'open' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when ${workOrders.status} = 'in_progress' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${workOrders.dueBy} < ${now} and ${workOrders.status} = 'open' then 1 else 0 end)`,
      critical: sql<number>`sum(case when ${workOrders.priority} = 'critical' and ${workOrders.status} = 'open' then 1 else 0 end)`,
    })
    .from(workOrders);

  const globalStats: Stats = {
    open: Number(globalResult?.open || 0),
    inProgress: Number(globalResult?.inProgress || 0),
    overdue: Number(globalResult?.overdue || 0),
    critical: Number(globalResult?.critical || 0),
  };

  if (!userId) {
    return { global: globalStats, personal: null };
  }

  // Optimized personal stats query
  const [personalResult] = await db
    .select({
      open: sql<number>`sum(case when ${workOrders.status} = 'open' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when ${workOrders.status} = 'in_progress' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${workOrders.dueBy} < ${now} and ${workOrders.status} in ('open', 'in_progress') then 1 else 0 end)`,
      critical: sql<number>`sum(case when ${workOrders.priority} = 'critical' and ${workOrders.status} in ('open', 'in_progress') then 1 else 0 end)`,
    })
    .from(workOrders)
    .where(eq(workOrders.assignedToId, userId));

  return {
    global: globalStats,
    personal: {
      open: Number(personalResult?.open || 0),
      inProgress: Number(personalResult?.inProgress || 0),
      overdue: Number(personalResult?.overdue || 0),
      critical: Number(personalResult?.critical || 0),
    },
  };
}

async function getMyWorkOrders(userId: number) {
  return db.query.workOrders.findMany({
    where: and(
      or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress")),
      eq(workOrders.assignedToId, userId)
    ),
    limit: 5,
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
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
}

async function getRecentWorkOrders() {
  return db.query.workOrders.findMany({
    where: eq(workOrders.status, "open"),
    limit: 5,
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
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
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { global: globalStats, personal: myStats } = await getStats(user?.id);
  const myWorkOrders = user ? await getMyWorkOrders(user.id) : [];
  const recentWorkOrders = await getRecentWorkOrders();

  const myTotalActive = myStats ? myStats.open + myStats.inProgress : 0;

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 min-h-full">
      {/* Page Header */}
      <PageHeader
        title="Technician"
        highlight="Terminal"
        description="Control panel for maintenance operations"
        icon={MonitorCog}
        className="pb-4"
      />

      {/* My Work Orders Stats - Personal */}
      {myStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold tracking-tight text-zinc-800">
              My Assigned Work Orders
            </h2>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              {myTotalActive} active
            </span>
          </div>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="My Open"
              value={myStats.open}
              icon={Inbox}
              variant="primary"
              href="/maintenance/work-orders?assigned=me&status=open"
              className="animate-stagger-1 animate-in"
            />
            <StatsCard
              title="My In Progress"
              value={myStats.inProgress}
              icon={Timer}
              variant="info"
              href="/maintenance/work-orders?assigned=me&status=in_progress"
              className="animate-stagger-2 animate-in"
            />
            <StatsCard
              title="My Overdue"
              value={myStats.overdue}
              icon={Clock}
              variant="danger"
              className={cn(
                "animate-stagger-3 animate-in",
                myStats.overdue > 0 ? "animate-pulse border-danger-300" : ""
              )}
              href="/maintenance/work-orders?assigned=me&overdue=true"
            />
            <StatsCard
              title="My Critical"
              value={myStats.critical}
              icon={AlertTriangle}
              variant="danger"
              className={cn(
                "animate-stagger-4 animate-in",
                myStats.critical > 0 ? "animate-pulse border-danger-300" : ""
              )}
              href="/maintenance/work-orders?assigned=me&priority=critical"
            />
          </div>
        </div>
      )}

      {/* My Work Orders Queue */}
      {myStats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-8 bg-primary-500 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight text-zinc-800">
                My Queue
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-bold"
            >
              <Link
                href="/maintenance/work-orders?assigned=me"
                className="gap-2"
              >
                MY WORK ORDERS <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <DashboardWorkOrderFeed workOrders={myWorkOrders} />
        </div>
      )}

      {/* System Stats - Global */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-bold tracking-tight text-zinc-600">
            System Overview
          </h2>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Open WOs"
            value={globalStats.open}
            icon={Inbox}
            variant="secondary"
            href="/maintenance/work-orders?status=open"
            className="animate-stagger-1 animate-in"
          />
          <StatsCard
            title="In Progress"
            value={globalStats.inProgress}
            icon={Timer}
            variant="info"
            href="/maintenance/work-orders?status=in_progress"
            className="animate-stagger-2 animate-in"
          />
          <StatsCard
            title="Overdue"
            value={globalStats.overdue}
            icon={Clock}
            variant="danger"
            className={cn(
              "animate-stagger-3 animate-in",
              globalStats.overdue > 0 ? "animate-pulse border-danger-300" : ""
            )}
            href="/maintenance/work-orders?overdue=true"
          />
          <StatsCard
            title="Critical"
            value={globalStats.critical}
            icon={AlertTriangle}
            variant="danger"
            className={cn(
              "animate-stagger-4 animate-in",
              globalStats.critical > 0 ? "animate-pulse border-danger-300" : ""
            )}
            href="/maintenance/work-orders?priority=critical"
          />
        </div>
      </div>

      {/* Recent Work Orders section - Global Queue */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 bg-zinc-400 rounded-full" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-800">
              Priority Queue
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-bold"
          >
            <Link href="/maintenance/work-orders" className="gap-2">
              ALL WORK ORDERS <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <DashboardWorkOrderFeed workOrders={recentWorkOrders} />
      </div>
    </div>
  );
}

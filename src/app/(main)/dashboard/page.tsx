import { DashboardWorkOrderFeed } from "@/components/dashboard/dashboard-work-order-feed";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import type { WorkOrderWithRelations } from "@/components/work-orders/work-order-card";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, count, eq, lt, or } from "drizzle-orm";
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
  const globalOpen = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "open"));

  const globalInProgress = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "in_progress"));

  const globalOverdue = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(lt(workOrders.dueBy, new Date()), eq(workOrders.status, "open"))
    );

  const globalCritical = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(eq(workOrders.priority, "critical"), eq(workOrders.status, "open"))
    );

  const globalStats: Stats = {
    open: globalOpen[0].count,
    inProgress: globalInProgress[0].count,
    overdue: globalOverdue[0].count,
    critical: globalCritical[0].count,
  };

  if (!userId) {
    return { global: globalStats, personal: null };
  }

  const myOpen = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(eq(workOrders.status, "open"), eq(workOrders.assignedToId, userId))
    );

  const myInProgress = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.status, "in_progress"),
        eq(workOrders.assignedToId, userId)
      )
    );

  const myOverdue = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(
        lt(workOrders.dueBy, new Date()),
        or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress")),
        eq(workOrders.assignedToId, userId)
      )
    );

  const myCritical = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.priority, "critical"),
        or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress")),
        eq(workOrders.assignedToId, userId)
      )
    );

  return {
    global: globalStats,
    personal: {
      open: myOpen[0].count,
      inProgress: myInProgress[0].count,
      overdue: myOverdue[0].count,
      critical: myCritical[0].count,
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
    <div className="space-y-6 sm:space-y-10 pb-8 industrial-grid min-h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-4 sm:pb-8">
        <h1 className="text-xl sm:text-3xl font-black tracking-tight text-zinc-900 uppercase">
          Technician <span className="text-primary-600">Terminal</span>
        </h1>
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          <MonitorCog className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Control panel for maintenance operations
        </div>
      </div>

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
              color="text-primary-600"
              bg="bg-primary-50"
              border="border-primary-100"
              delay={1}
              href="/maintenance/work-orders?assigned=me&status=open"
            />
            <StatsCard
              title="My In Progress"
              value={myStats.inProgress}
              icon={Timer}
              color="text-info-600"
              bg="bg-info-50"
              border="border-info-100"
              delay={2}
              href="/maintenance/work-orders?assigned=me&status=in_progress"
            />
            <StatsCard
              title="My Overdue"
              value={myStats.overdue}
              icon={Clock}
              color="text-danger-600"
              bg="bg-danger-50"
              border="border-danger-100"
              pulse={myStats.overdue > 0}
              delay={3}
              href="/maintenance/work-orders?assigned=me&overdue=true"
            />
            <StatsCard
              title="My Critical"
              value={myStats.critical}
              icon={AlertTriangle}
              color="text-danger-700"
              bg="bg-danger-100"
              border="border-danger-200"
              pulse={myStats.critical > 0}
              delay={4}
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

          <DashboardWorkOrderFeed
            workOrders={myWorkOrders as unknown as WorkOrderWithRelations[]}
          />
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
            color="text-secondary-600"
            bg="bg-secondary-50"
            border="border-secondary-100"
            delay={1}
            href="/maintenance/work-orders?status=open"
          />
          <StatsCard
            title="In Progress"
            value={globalStats.inProgress}
            icon={Timer}
            color="text-info-600"
            bg="bg-info-50"
            border="border-info-100"
            delay={2}
            href="/maintenance/work-orders?status=in_progress"
          />
          <StatsCard
            title="Overdue"
            value={globalStats.overdue}
            icon={Clock}
            color="text-danger-600"
            bg="bg-danger-50"
            border="border-danger-100"
            pulse={globalStats.overdue > 0}
            delay={3}
            href="/maintenance/work-orders?overdue=true"
          />
          <StatsCard
            title="Critical"
            value={globalStats.critical}
            icon={AlertTriangle}
            color="text-danger-700"
            bg="bg-danger-100"
            border="border-danger-200"
            pulse={globalStats.critical > 0}
            delay={4}
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

        <DashboardWorkOrderFeed
          workOrders={recentWorkOrders as unknown as WorkOrderWithRelations[]}
        />
      </div>
    </div>
  );
}

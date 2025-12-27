import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, count, eq, lt, or } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  PartyPopper,
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
    .where(and(lt(workOrders.dueBy, new Date()), eq(workOrders.status, "open")));

  const globalCritical = await db
    .select({ count: count() })
    .from(workOrders)
    .where(and(eq(workOrders.priority, "critical"), eq(workOrders.status, "open")));

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
    .where(and(eq(workOrders.status, "open"), eq(workOrders.assignedToId, userId)));

  const myInProgress = await db
    .select({ count: count() })
    .from(workOrders)
    .where(
      and(eq(workOrders.status, "in_progress"), eq(workOrders.assignedToId, userId))
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
      equipment: true,
      reportedBy: true,
    },
  });
}

async function getRecentWorkOrders() {
  return db.query.workOrders.findMany({
    where: eq(workOrders.status, "open"),
    limit: 5,
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    with: {
      equipment: true,
      reportedBy: true,
    },
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { global: globalStats, personal: myStats } = await getStats(user?.id);
  const myWorkOrders = user ? await getMyWorkOrders(user.id) : [];
  const recentWorkOrders = await getRecentWorkOrders();

  const hasMyWorkOrders = myWorkOrders.length > 0;
  const myTotalActive = myStats ? myStats.open + myStats.inProgress : 0;

  return (
    <div className="space-y-10 pb-8 industrial-grid min-h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          Technician{" "}
          <span className="text-primary-600 uppercase">Terminal</span>
        </h1>
        <p className="text-zinc-500 font-medium">
          Control panel for maintenance operations
        </p>
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
              href="/dashboard/work-orders?assigned=me&status=open"
            />
            <StatsCard
              title="My In Progress"
              value={myStats.inProgress}
              icon={Timer}
              color="text-info-600"
              bg="bg-info-50"
              border="border-info-100"
              delay={2}
              href="/dashboard/work-orders?assigned=me&status=in_progress"
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
              href="/dashboard/work-orders?assigned=me&overdue=true"
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
              href="/dashboard/work-orders?assigned=me&priority=critical"
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
              <Link href="/dashboard/work-orders?assigned=me" className="gap-2">
                MY WORK ORDERS <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {hasMyWorkOrders ? (
            <div className="grid gap-4">
              {myWorkOrders.map((workOrder, index) => (
                <WorkOrderListItem key={workOrder.id} workOrder={workOrder} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-success-200 bg-success-50/30 p-12 text-center animate-in backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-success-400/20 rounded-full blur-[40px] animate-gentle-pulse" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success-400/20 to-success-500/20 border border-success-200 shadow-inner">
                  <PartyPopper className="h-8 w-8 text-success-600" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-black text-success-900 tracking-tight">
                All Caught Up!
              </h3>
              <p className="text-success-700 font-medium mt-1">
                No work orders assigned to you. Great work!
              </p>
            </div>
          )}
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
            href="/dashboard/work-orders?status=open"
          />
          <StatsCard
            title="In Progress"
            value={globalStats.inProgress}
            icon={Timer}
            color="text-info-600"
            bg="bg-info-50"
            border="border-info-100"
            delay={2}
            href="/dashboard/work-orders?status=in_progress"
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
            href="/dashboard/work-orders?overdue=true"
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
            href="/dashboard/work-orders?priority=critical"
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
            <Link href="/dashboard/work-orders" className="gap-2">
              ALL WORK ORDERS <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentWorkOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-success-200 bg-success-50/30 p-16 text-center animate-in backdrop-blur-sm">
            <div className="relative">
              <div className="absolute inset-0 bg-success-400/20 rounded-full blur-[40px] animate-gentle-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-success-400/20 to-success-500/20 border border-success-200 shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-success-600" />
              </div>
            </div>
            <h3 className="mt-8 text-2xl font-black text-success-900 tracking-tight">
              SYSTEM NOMINAL
            </h3>
            <p className="text-success-700 font-medium mt-1">
              No open work orders requiring urgent attention.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recentWorkOrders.map((workOrder, index) => (
              <WorkOrderListItem key={workOrder.id} workOrder={workOrder} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  border,
  pulse = false,
  delay = 0,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  pulse?: boolean;
  delay?: number;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-inner border border-white/50",
            bg
          )}
        >
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <div className="h-1 w-12 bg-zinc-100 rounded-full" />
      </div>

      <div>
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">
          {title}
        </p>
        <p
          className={cn(
            "text-4xl font-mono font-black leading-none tracking-tight",
            color
          )}
        >
          {String(value).padStart(2, "0")}
        </p>
      </div>
    </>
  );

  const className = cn(
    "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 card-industrial shadow-sm",
    border,
    pulse && value > 0 && "animate-glow-pulse border-danger-300",
    delay && `animate-stagger-${delay} animate-in`,
    href && "cursor-pointer hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function WorkOrderListItem({
  workOrder,
  index = 0,
}: {
  workOrder: {
    id: number;
    title: string;
    priority: string;
    createdAt: Date;
    equipment: { name: string };
    reportedBy: { name: string };
  };
  index?: number;
}) {
  const priorityConfig = {
    low: {
      color: "bg-success-500",
      label: "Low",
      text: "text-success-700",
      bg: "bg-success-50",
    },
    medium: {
      color: "bg-primary-500",
      label: "Medium",
      text: "text-primary-700",
      bg: "bg-primary-50",
    },
    high: {
      color: "bg-warning-500",
      label: "High",
      text: "text-warning-700",
      bg: "bg-warning-50",
    },
    critical: {
      color: "bg-danger-600",
      label: "Critical",
      text: "text-danger-700",
      bg: "bg-danger-50",
    },
  }[workOrder.priority as string] || {
    color: "bg-zinc-500",
    label: workOrder.priority,
    text: "text-zinc-700",
    bg: "bg-zinc-50",
  };

  const staggerClass = index < 5 ? `animate-stagger-${index + 1}` : "";

  return (
    <Link
      href={`/dashboard/work-orders/${workOrder.id}`}
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm p-4 transition-all duration-200 hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1",
        staggerClass && `${staggerClass} animate-in`,
        workOrder.priority === "critical" &&
          "border-danger-200 shadow-danger-500/5 shadow-lg"
      )}
    >
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex-none rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono font-black text-white leading-none">
            #{String(workOrder.id).padStart(3, "0")}
          </span>
          <h3 className="font-black text-zinc-900 group-hover:text-primary-600 transition-colors text-base tracking-tight truncate flex-1">
            {workOrder.title}
          </h3>
          <Badge
            className={cn(
              "font-black text-[10px] px-1.5 py-0",
              priorityConfig.bg,
              priorityConfig.text,
              "border-0"
            )}
          >
            {priorityConfig.label.toUpperCase()}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200/50">
            <div className="w-2 h-2 rounded-full bg-zinc-400" />
            {workOrder.equipment.name}
          </div>
          <div className="flex items-center gap-1.5 font-medium text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
          <div className="flex items-center gap-1.5 font-medium text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            Reported by {workOrder.reportedBy.name}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end sm:justify-center w-full sm:w-auto mt-2 sm:mt-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

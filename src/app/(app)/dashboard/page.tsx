import {
  DashboardContent,
  DashboardHeaderActions,
  DashboardStats,
} from "@/components/dashboard/customizable-dashboard";
import { DashboardWorkOrderFeed } from "@/components/dashboard/dashboard-work-order-feed";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { type SessionUser, getCurrentUser } from "@/lib/session";
import { and, eq, or, sql } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Inbox,
  Timer,
  User,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface Stats {
  open: number;
  inProgress: number;
  overdue: number;
  critical: number;
}

async function getStats(
  user: SessionUser | null
): Promise<{ global: Stats; personal: Stats | null }> {
  const userId = user?.id;
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";
  const now = new Date();

  // Optimized global (or departmental) stats query
  const query = db
    .select({
      open: sql<number>`sum(case when ${workOrders.status} = 'open' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when ${workOrders.status} = 'in_progress' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${workOrders.dueBy} < ${now.toISOString()} and ${workOrders.status} = 'open' then 1 else 0 end)`,
      critical: sql<number>`sum(case when ${workOrders.priority} = 'critical' and ${workOrders.status} = 'open' then 1 else 0 end)`,
    })
    .from(workOrders);

  if (isTech && departmentId) {
    query.where(eq(workOrders.departmentId, departmentId));
  }

  const [globalResult] = await query;

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
      overdue: sql<number>`sum(case when ${workOrders.dueBy} < ${now.toISOString()} and ${workOrders.status} in ('open', 'in_progress') then 1 else 0 end)`,
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

async function getMyWorkOrders(userId: string) {
  return db.query.workOrders.findMany({
    where: and(
      or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress")),
      eq(workOrders.assignedToId, userId)
    ),
    limit: 7,
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

async function getRecentWorkOrders(user: SessionUser | null) {
  const conditions = [eq(workOrders.status, "open")];

  if (user?.roleName === "tech" && user?.departmentId) {
    conditions.push(eq(workOrders.departmentId, user.departmentId));
  }

  return db.query.workOrders.findMany({
    where: and(...conditions),
    limit: 7,
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

function StatsLoading() {
  return (
    <div className="grid gap-1 grid-cols-1 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr bg-border rounded-xl overflow-hidden shadow-lg animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-card/50" />
      ))}
    </div>
  );
}

function FeedLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 bg-card animate-pulse rounded-lg border border-border"
        />
      ))}
    </div>
  );
}

async function PersonalStatsSection({ user }: { user: SessionUser }) {
  const t = await getTranslations("dashboard");
  const { personal: myStats } = await getStats(user);
  if (!myStats) return null;

  const myTotalActive = myStats.open + myStats.inProgress;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          {t("myAssignedWorkOrders")}
        </h2>
        <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {myTotalActive} {t("active")}
        </span>
      </div>
      <StatsTicker
        variant="compact"
        stats={[
          {
            label: t("myOpen"),
            value: myStats.open,
            icon: Inbox,
            variant: "primary",
          },
          {
            label: t("myInProgress"),
            value: myStats.inProgress,
            icon: Timer,
            variant: "default",
          },
          {
            label: t("myOverdue"),
            value: myStats.overdue,
            icon: Clock,
            variant: "danger",
          },
          {
            label: t("myCritical"),
            value: myStats.critical,
            icon: AlertTriangle,
            variant: "danger",
          },
        ]}
      />
    </div>
  );
}

async function PersonalQueueSection({ userId }: { userId: string }) {
  const t = await getTranslations("dashboard");
  const myWorkOrders = await getMyWorkOrders(userId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-6 bg-primary rounded-full" />
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
            {t("myQueue")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 text-[9px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          <Link href="/maintenance/work-orders?assigned=me" className="gap-1.5">
            {t("listView")} <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </Button>
      </div>

      <DashboardWorkOrderFeed workOrders={myWorkOrders} />
    </div>
  );
}

async function GlobalStatsSection({ user }: { user: SessionUser | null }) {
  const t = await getTranslations("dashboard");
  const { global: globalStats } = await getStats(user);
  const title =
    user?.roleName === "tech" ? t("departmentalOverview") : t("systemOverview");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          {title}
        </h2>
      </div>
      <StatsTicker
        variant="compact"
        stats={[
          {
            label: t("openWOs"),
            value: globalStats.open,
            icon: Inbox,
            variant: "default",
          },
          {
            label: t("inProgress"),
            value: globalStats.inProgress,
            icon: Timer,
            variant: "default",
          },
          {
            label: t("overdue"),
            value: globalStats.overdue,
            icon: Clock,
            variant: "danger",
          },
          {
            label: t("critical"),
            value: globalStats.critical,
            icon: AlertTriangle,
            variant: "danger",
          },
        ]}
      />
    </div>
  );
}

async function GlobalQueueSection({ user }: { user: SessionUser | null }) {
  const t = await getTranslations("dashboard");
  const recentWorkOrders = await getRecentWorkOrders(user);
  const title =
    user?.roleName === "tech"
      ? t("departmentPriorityQueue")
      : t("systemPriorityQueue");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-6 bg-muted-foreground/30 rounded-full" />
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 text-[9px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
        >
          <Link href="/maintenance/work-orders" className="gap-1.5">
            {t("allTickets")} <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </Button>
      </div>

      <DashboardWorkOrderFeed workOrders={recentWorkOrders} />
    </div>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // If user is not a technician/admin, redirect them to the operator home screen
  // This helps ensure users end up on the correct mobile-optimized root page
  if (!hasPermission(user.permissions, PERMISSIONS.TICKET_VIEW_ALL)) {
    redirect("/home");
  }

  return (
    <PageLayout
      id="dashboard-page"
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      bgSymbol="TT"
      headerActions={
        <DashboardHeaderActions>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[10px] font-black uppercase tracking-widest border-primary/30 hover:bg-primary/10"
            asChild
          >
            <Link href="/assets/qr-codes">{t("scanQr")}</Link>
          </Button>
          <Button
            size="sm"
            className="h-8 text-[10px] font-black uppercase tracking-widest"
            asChild
          >
            <Link href="/">{t("reportIssue")}</Link>
          </Button>
        </DashboardHeaderActions>
      }
      stats={
        <DashboardStats
          personalStatsWidget={
            user ? (
              <Suspense fallback={<StatsLoading />}>
                <PersonalStatsSection user={user} />
              </Suspense>
            ) : null
          }
          globalStatsWidget={
            <Suspense fallback={<StatsLoading />}>
              <GlobalStatsSection user={user} />
            </Suspense>
          }
        />
      }
    >
      <DashboardContent
        myQueueWidget={
          user ? (
            <Suspense fallback={<FeedLoading />}>
              <PersonalQueueSection userId={user.id} />
            </Suspense>
          ) : null
        }
        globalQueueWidget={
          <Suspense fallback={<FeedLoading />}>
            <GlobalQueueSection user={user} />
          </Suspense>
        }
      />
    </PageLayout>
  );
}

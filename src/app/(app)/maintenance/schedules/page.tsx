import { SchedulesClient } from "@/components/maintenance/schedules-client";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { db } from "@/db";
import { maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  month?: string;
  year?: string;
};

async function getSchedules() {
  return db.query.maintenanceSchedules.findMany({
    where: eq(maintenanceSchedules.isActive, true),
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
    },
    orderBy: [desc(maintenanceSchedules.nextDue)],
  });
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const today = new Date();
  const currentYear = params.year
    ? Number.parseInt(params.year)
    : today.getFullYear();
  const currentMonth = params.month
    ? Number.parseInt(params.month)
    : today.getMonth();

  const schedules = await getSchedules();

  const overdueCount = schedules.filter((s) => {
    if (!s.nextDue) return false;
    return new Date(s.nextDue) < today;
  }).length;

  const thisMonthCount = schedules.filter((s) => {
    if (!s.nextDue) return false;
    const due = new Date(s.nextDue);
    return due.getMonth() === currentMonth && due.getFullYear() === currentYear;
  }).length;

  const upcomingCount = schedules.filter((s) => {
    if (!s.nextDue) return false;
    const due = new Date(s.nextDue);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= today && due <= weekFromNow;
  }).length;

  return (
    <PageLayout
      id="maintenance-schedules-page"
      title="Maintenance Schedules"
      subtitle="Operations Registry"
      description={`${schedules.length} ACTIVE WORK PLANS | ${overdueCount} OVERDUE`}
      bgSymbol="PM"
      headerActions={
        user?.roleName === "admin" && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted/80 transition-all border-white/10"
            >
              <Link href="/maintenance/schedules/manage">
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
            >
              <Link href="/maintenance/schedules/new">
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Link>
            </Button>
          </div>
        )
      }
      stats={
        <StatsTicker
          stats={[
            {
              label: "Overdue Tasks",
              value: overdueCount,
              icon: AlertTriangle,
              variant: "danger",
            },
            {
              label: "Active This Month",
              value: thisMonthCount,
              icon: CalendarIcon,
              variant: "primary",
            },
            {
              label: "Next 7 Days",
              value: upcomingCount,
              icon: Clock,
              variant: "warning",
            },
          ]}
        />
      }
    >
      <SchedulesClient
        schedules={schedules}
        initialMonth={currentMonth}
        initialYear={currentYear}
      />
    </PageLayout>
  );
}

import { SchedulerButton } from "@/components/maintenance/scheduler-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Plus,
  Search,
  Settings,
  Wrench,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  search?: string;
  type?: string;
};

async function getSchedules(params: SearchParams) {
  const allSchedules = await db.query.maintenanceSchedules.findMany({
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
    },
    orderBy: [desc(maintenanceSchedules.nextDue)],
  });

  let filtered = allSchedules;

  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(search) ||
        s.equipment?.name.toLowerCase().includes(search)
    );
  }

  if (params.type && params.type !== "all") {
    filtered = filtered.filter((s) => s.type === params.type);
  }

  return filtered;
}

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const schedules = await getSchedules(params);
  const today = new Date();

  // Stats
  const activeCount = schedules.filter((s) => s.isActive).length;
  const maintenanceCount = schedules.filter(
    (s) => s.type === "maintenance"
  ).length;
  const calibrationCount = schedules.filter(
    (s) => s.type === "calibration"
  ).length;
  const overdueCount = schedules.filter((s) => {
    if (!s.nextDue || !s.isActive) return false;
    return new Date(s.nextDue) < today;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/maintenance/schedules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Maintenance Schedules
            </h1>
            <p className="text-muted-foreground">
              {schedules.length} schedules
            </p>
          </div>
        </div>
        {user?.role === "admin" && (
          <div className="flex gap-2">
            <SchedulerButton />
            <Button asChild>
              <Link href="/maintenance/schedules/new">
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active"
          value={activeCount}
          icon={Calendar}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          title="Maintenance"
          value={maintenanceCount}
          icon={Wrench}
          color="text-slate-600"
          bg="bg-slate-50"
        />
        <StatCard
          title="Calibration"
          value={calibrationCount}
          icon={Settings}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={ClipboardCheck}
          color="text-rose-600"
          bg="bg-rose-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form
          action="/maintenance/schedules"
          className="relative flex-1 md:max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search schedules..."
            defaultValue={params.search}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </form>
        <div className="flex gap-2">
          <FilterLink
            href="/maintenance/schedules"
            active={!params.type || params.type === "all"}
          >
            All
          </FilterLink>
          <FilterLink
            href="/maintenance/schedules?type=maintenance"
            active={params.type === "maintenance"}
          >
            Maintenance
          </FilterLink>
          <FilterLink
            href="/maintenance/schedules?type=calibration"
            active={params.type === "calibration"}
          >
            Calibration
          </FilterLink>
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No schedules found</h3>
          <p className="text-sm text-muted-foreground">
            Create your first maintenance schedule to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/maintenance/schedules/new">
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr className="text-left font-medium text-muted-foreground">
                <th className="p-3">Schedule</th>
                <th className="p-3 hidden md:table-cell">Equipment</th>
                <th className="p-3 hidden lg:table-cell">Frequency</th>
                <th className="p-3">Next Due</th>
                <th className="p-3 hidden sm:table-cell">Status</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((schedule) => {
                const dueDate = schedule.nextDue
                  ? new Date(schedule.nextDue)
                  : null;
                const isOverdue = dueDate && dueDate < today;
                const daysUntil = dueDate
                  ? Math.ceil(
                      (dueDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <tr
                    key={schedule.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="p-3">
                      <Link
                        href={`/maintenance/schedules/${schedule.id}`}
                        data-testid="schedule-link"
                        className="flex items-center gap-3 group/item"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover/item:scale-110",
                            schedule.type === "maintenance"
                              ? "bg-primary-50"
                              : "bg-amber-50"
                          )}
                        >
                          {schedule.type === "maintenance" ? (
                            <Wrench className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Settings className="h-4 w-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium group-hover/item:text-primary-600 transition-colors">
                            {schedule.title}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {schedule.type}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <p className="font-medium">{schedule.equipment?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {schedule.equipment?.location?.name}
                      </p>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      Every {schedule.frequencyDays} days
                    </td>
                    <td className="p-3">
                      {dueDate ? (
                        <div>
                          <p
                            className={cn(
                              "font-medium",
                              isOverdue && "text-rose-600"
                            )}
                          >
                            {dueDate.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isOverdue
                              ? `${Math.abs(daysUntil!)} days overdue`
                              : daysUntil === 0
                                ? "Today"
                                : `In ${daysUntil} days`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge
                        variant={schedule.isActive ? "success" : "secondary"}
                      >
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/maintenance/schedules/${schedule.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-100 text-primary-700"
          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

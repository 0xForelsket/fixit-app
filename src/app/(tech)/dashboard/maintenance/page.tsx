import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Wrench,
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Build events map (date -> schedules)
  const eventsMap = new Map<string, typeof schedules>();
  for (const schedule of schedules) {
    if (schedule.nextDue) {
      const dueDate = new Date(schedule.nextDue);
      if (
        dueDate.getMonth() === currentMonth &&
        dueDate.getFullYear() === currentYear
      ) {
        const key = dueDate.getDate().toString();
        const existing = eventsMap.get(key) || [];
        existing.push(schedule);
        eventsMap.set(key, existing);
      }
    }
  }

  // Navigation URLs
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Stats
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Preventive Maintenance
          </h1>
          <p className="text-muted-foreground">
            Schedule and track maintenance tasks
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" && (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard/maintenance/schedules">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Schedules
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/maintenance/schedules/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Schedule
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          color={overdueCount > 0 ? "text-rose-600" : "text-slate-400"}
          bg={overdueCount > 0 ? "bg-rose-50" : "bg-slate-50"}
        />
        <StatCard
          title="This Month"
          value={thisMonthCount}
          icon={Calendar}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          title="Next 7 Days"
          value={upcomingCount}
          icon={Wrench}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-white shadow-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/maintenance?month=${prevMonth}&year=${prevYear}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-lg font-semibold">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/maintenance?month=${nextMonth}&year=${nextYear}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-24 border-b border-r bg-slate-50/50 p-2"
            />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const events = eventsMap.get(day.toString()) || [];
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isPast =
              new Date(currentYear, currentMonth, day) <
              new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={day}
                className={cn(
                  "min-h-24 border-b border-r p-2 transition-colors hover:bg-slate-50",
                  isToday && "bg-primary-50/50"
                )}
              >
                <div
                  className={cn(
                    "mb-1 text-sm font-medium",
                    isToday && "text-primary-600",
                    isPast && !isToday && "text-muted-foreground"
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => {
                    const isOverdue =
                      event.nextDue && new Date(event.nextDue) < today;
                    return (
                      <Link
                        key={event.id}
                        href={`/dashboard/maintenance/schedules/${event.id}`}
                        className={cn(
                          "block truncate rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
                          event.type === "maintenance"
                            ? isOverdue
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                            : isOverdue
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        )}
                      >
                        {event.equipment?.name || event.title}
                      </Link>
                    );
                  })}
                  {events.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming List */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-4 font-semibold">Upcoming Maintenance</h3>
        {schedules.filter((s) => s.nextDue && new Date(s.nextDue) >= today)
          .length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming maintenance scheduled
          </p>
        ) : (
          <div className="space-y-2">
            {schedules
              .filter((s) => s.nextDue)
              .sort(
                (a, b) =>
                  new Date(a.nextDue!).getTime() -
                  new Date(b.nextDue!).getTime()
              )
              .slice(0, 5)
              .map((schedule) => {
                const dueDate = new Date(schedule.nextDue!);
                const isOverdue = dueDate < today;
                const daysUntil = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Link
                    key={schedule.id}
                    href={`/dashboard/maintenance/schedules/${schedule.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          schedule.type === "maintenance"
                            ? "bg-primary-50"
                            : "bg-amber-50"
                        )}
                      >
                        {schedule.type === "maintenance" ? (
                          <Wrench
                            className={cn(
                              "h-5 w-5",
                              schedule.type === "maintenance"
                                ? "text-primary-600"
                                : "text-amber-600"
                            )}
                          />
                        ) : (
                          <Settings className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.equipment?.name} •{" "}
                          {schedule.equipment?.location?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          isOverdue
                            ? "destructive"
                            : daysUntil <= 7
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntil)} days overdue`
                          : daysUntil === 0
                            ? "Today"
                            : daysUntil === 1
                              ? "Tomorrow"
                              : `In ${daysUntil} days`}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
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
      <div className="flex items-center justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Preventive <span className="text-primary-600">Maintenance</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5" />
            SCHEDULED TASKS AND OPERATIONS
          </div>
        </div>
        <div className="flex gap-2">
          {user?.roleName === "admin" && (
            <>
              <Button
                variant="outline"
                asChild
                className="font-bold border-zinc-200 text-zinc-600 hover:text-zinc-900"
              >
                <Link href="/maintenance/schedules">
                  <Settings className="mr-2 h-4 w-4" />
                  MANAGE SCHEDULES
                </Link>
              </Button>
              <Button
                asChild
                className="font-bold shadow-lg shadow-primary-500/20"
              >
                <Link href="/maintenance/schedules/new">
                  <Plus className="mr-2 h-4 w-4" />
                  NEW SCHEDULE
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          variant={overdueCount > 0 ? "danger" : "secondary"}
          className={cn(
            "animate-stagger-1 animate-in",
            overdueCount > 0 && "animate-pulse"
          )}
        />
        <StatsCard
          title="This Month"
          value={thisMonthCount}
          icon={Calendar}
          variant="primary"
          className="animate-stagger-2 animate-in"
        />
        <StatsCard
          title="Next 7 Days"
          value={upcomingCount}
          icon={Wrench}
          variant="warning"
          className="animate-stagger-3 animate-in"
        />
      </div>

      {/* Mobile Agenda View */}
      <div className="lg:hidden space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">
            Agenda
          </h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-8 w-8 rounded-lg border-2"
            >
              <Link
                href={`/maintenance/schedules?month=${prevMonth}&year=${prevYear}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="bg-zinc-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center">
              {monthNames[currentMonth]}
            </div>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-8 w-8 rounded-lg border-2"
            >
              <Link
                href={`/maintenance/schedules?month=${nextMonth}&year=${nextYear}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed bg-zinc-50">
            <Calendar className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="font-bold text-zinc-500">No tasks this month</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Section */}
            {overdueCount > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </h3>
                {schedules
                  .filter((s) => s.nextDue && new Date(s.nextDue) < today)
                  .map((schedule, index) => (
                    <AgendaItem
                      key={schedule.id}
                      schedule={schedule}
                      today={today}
                      index={index}
                    />
                  ))}
              </div>
            )}

            {/* This Month Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> {monthNames[currentMonth]}{" "}
                {currentYear}
              </h3>
              {schedules
                .filter((s) => {
                  if (!s.nextDue) return false;
                  const due = new Date(s.nextDue);
                  return (
                    due >= today &&
                    due.getMonth() === currentMonth &&
                    due.getFullYear() === currentYear
                  );
                })
                .map((schedule, index) => (
                  <AgendaItem
                    key={schedule.id}
                    schedule={schedule}
                    today={today}
                    index={index}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Calendar View */}
      <div className="hidden lg:block rounded-xl border-2 bg-white shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b p-4 bg-zinc-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-bold border-2"
            >
              <Link
                href={`/maintenance/schedules?month=${prevMonth}&year=${prevYear}`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="font-bold border-2"
            >
              <Link
                href={`/maintenance/schedules?month=${nextMonth}&year=${nextYear}`}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-zinc-100/50 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-zinc-200 gap-[1px]">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-32 bg-zinc-50/50 p-2" />
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
                  "min-h-32 bg-white p-2 transition-colors hover:bg-zinc-50 group relative animate-in fade-in duration-500",
                  isToday && "bg-primary-50/30"
                )}
                style={{ animationDelay: `${(i % 7) * 50}ms` }}
              >
                <div
                  className={cn(
                    "mb-2 text-sm font-black",
                    isToday
                      ? "text-primary-600 bg-primary-100 w-7 h-7 flex items-center justify-center rounded-full -ml-1 -mt-1"
                      : isPast && !isToday
                        ? "text-zinc-400"
                        : "text-zinc-900"
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 4).map((event) => {
                    const isOverdue =
                      event.nextDue && new Date(event.nextDue) < today;
                    return (
                      <Link
                        key={event.id}
                        href={`/maintenance/schedules/${event.id}`}
                        className={cn(
                          "block truncate rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-[1.02]",
                          event.type === "maintenance"
                            ? isOverdue
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                              : "bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-200"
                            : isOverdue
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                        )}
                      >
                        {event.equipment?.name || event.title}
                      </Link>
                    );
                  })}
                  {events.length > 4 && (
                    <div className="text-[10px] font-bold text-zinc-400 pl-1">
                      +{events.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgendaItem({
  schedule,
  today,
  index,
}: {
  schedule: {
    id: number;
    title: string;
    type: string;
    nextDue: Date | null;
    equipment?: { name: string } | null;
  };
  today: Date;
  index: number;
}) {
  const staggerClass =
    index < 5
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";
  const dueDate = schedule.nextDue ? new Date(schedule.nextDue) : null;
  const isOverdue = dueDate && dueDate < today;
  const daysUntil = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Link
      href={`/maintenance/schedules/${schedule.id}`}
      className={cn(
        "block rounded-2xl border-2 bg-white p-4 shadow-sm active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-1",
        isOverdue ? "border-rose-200 shadow-rose-50" : "border-zinc-200",
        staggerClass
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-lg",
              schedule.type === "maintenance" ? "bg-primary-50" : "bg-amber-50"
            )}
          >
            {schedule.type === "maintenance" ? (
              <Wrench className="h-4 w-4 text-primary-600" />
            ) : (
              <Settings className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-tight text-zinc-900 leading-none mb-1">
              {schedule.title}
            </p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {schedule.equipment?.name || "No Equipment"}
            </p>
          </div>
        </div>
        <Badge
          variant={
            isOverdue ? "destructive" : daysUntil <= 7 ? "warning" : "secondary"
          }
          className="text-[10px] font-black px-2 py-0 uppercase"
        >
          {isOverdue
            ? "Overdue"
            : daysUntil === 0
              ? "Today"
              : daysUntil === 1
                ? "Tomorrow"
                : `In ${daysUntil}d`}
        </Badge>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-50">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {dueDate?.toLocaleDateString()}
        </span>
        <span className="text-xs font-black text-primary-600 flex items-center gap-1">
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

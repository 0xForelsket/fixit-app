import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { db } from "@/db";
import { maintenanceSchedules } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MonitorCog,
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

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

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
    <PageContainer id="maintenance-schedules-page" className="space-y-10">
      <PageHeader
        title="Maintenance Schedules"
        subtitle="Operations Registry"
        description={`${schedules.length} ACTIVE WORK PLANS | ${overdueCount} OVERDUE`}
        bgSymbol="PM"
        actions={
          user?.roleName === "admin" && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                asChild
                className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted/80 transition-all"
              >
                <Link href="/maintenance/schedules">
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
      />

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
            icon: Calendar,
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

      <div className="lg:hidden space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-black italic text-foreground leading-none">
              Agenda
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="font-black text-[10px] uppercase tracking-widest h-8 px-3 bg-muted rounded-full"
            >
              <Filter className="h-3 w-3 mr-1.5" /> Filter
            </Button>
          </div>

          <div className="flex items-center gap-2 bg-card border-2 border-foreground p-1 rounded-full shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 rounded-full hover:bg-muted"
            >
              <Link
                href={`/maintenance/schedules?month=${prevMonth}&year=${prevYear}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1 text-center font-mono text-xs font-black uppercase tracking-[0.2em] py-2">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 rounded-full hover:bg-muted"
            >
              <Link
                href={`/maintenance/schedules?month=${nextMonth}&year=${nextYear}`}
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border-2 border-dashed border-border bg-card/50">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-black text-sm uppercase tracking-widest text-muted-foreground">
              Registry Empty
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules
              .filter((s) => {
                if (!s.nextDue) return false;
                const due = new Date(s.nextDue);
                return (
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
        )}
      </div>

      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h2 className="text-5xl font-serif font-black tracking-tighter text-foreground italic">
              {monthNames[currentMonth]}{" "}
              <span className="text-muted-foreground/30 not-italic">
                {currentYear}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-foreground p-1.5 rounded-full shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 rounded-full text-background hover:bg-background/10"
            >
              <Link
                href={`/maintenance/schedules?month=${prevMonth}&year=${prevYear}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="w-px h-4 bg-background/20" />
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-10 w-10 rounded-full text-background hover:bg-background/10"
            >
              <Link
                href={`/maintenance/schedules?month=${nextMonth}&year=${nextYear}`}
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border-2 border-foreground bg-card shadow-2xl overflow-hidden shadow-primary/5">
          <div className="grid grid-cols-7 border-b-2 border-foreground bg-muted/30">
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div
                key={day}
                className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center border-r border-foreground last:border-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-foreground gap-[2px]">
            {/* Days Grid Rendering ... */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[160px] bg-zinc-100/50 bg-industrial-pattern opacity-30"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = eventsMap.get(day.toString()) || [];
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[160px] bg-white p-4 transition-all hover:bg-zinc-50 group relative animate-in fade-in slide-in-from-top-1",
                    isToday &&
                      "bg-primary-50/30 ring-2 ring-primary-500/20 z-10"
                  )}
                  style={{ animationDelay: `${(i % 7) * 40}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={cn(
                        "text-sm font-black font-mono tracking-tighter",
                        isToday ? "text-primary-600" : "text-zinc-300"
                      )}
                    >
                      {day.toString().padStart(2, "0")}
                    </span>
                    {isToday && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {events.map((event) => {
                      const isOverdue =
                        event.nextDue && new Date(event.nextDue) < today;
                      return (
                        <Link
                          key={event.id}
                          href={`/maintenance/schedules/${event.id}`}
                          className={cn(
                            "block p-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border shadow-sm",
                            isOverdue
                              ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                              : "bg-zinc-50 border-zinc-100 text-zinc-900 hover:bg-zinc-100"
                          )}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-tight truncate">
                              {event.equipment?.name || "System"}
                            </span>
                            <span className="text-[10px] font-bold opacity-60 truncate">
                              {event.title}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Fill remaining cells */}
            {Array.from({
              length: (7 - ((firstDay + daysInMonth) % 7)) % 7,
            }).map((_, i) => (
              <div
                key={`empty-end-${i}`}
                className="min-h-[160px] bg-zinc-100/50 bg-industrial-pattern opacity-30"
              />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
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
        "group relative block overflow-hidden rounded-3xl border-2 bg-card p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]",
        isOverdue
          ? "border-rose-500/30 shadow-rose-500/5"
          : "border-foreground shadow-primary/5",
        staggerClass
      )}
    >
      <div className="relative z-10 flex gap-6">
        {/* Type Icon */}
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-transform group-hover:rotate-6",
            isOverdue
              ? "bg-rose-50 border-rose-500 text-rose-600"
              : "bg-muted border-foreground text-foreground"
          )}
        >
          {schedule.type === "maintenance" ? (
            <Wrench className="h-8 w-8" />
          ) : (
            <Settings className="h-8 w-8" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-xl font-serif font-black tracking-tight text-foreground truncate uppercase mt-1">
              {schedule.title}
            </h3>
            <Badge
              variant={isOverdue ? "destructive" : "outline"}
              className="rounded-full font-black text-[9px] uppercase tracking-widest px-3 border-2"
            >
              {isOverdue ? "Overdue" : "Scheduled"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <MonitorCog className="h-3.5 w-3.5 opacity-50" />
              {schedule.equipment?.name || "Unassigned"}
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 opacity-50" />
              {daysUntil} Days Left
            </div>
          </div>
        </div>

        {/* Action Icon */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-1rem]">
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Link>
  );
}

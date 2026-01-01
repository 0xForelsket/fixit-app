"use client";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, List, TimerIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AgendaItem } from "./agenda-item";
import { SchedulesTable } from "./schedules-table";
import { SchedulesTimeline } from "./schedules-timeline";

interface Schedule {
  id: string;
  title: string;
  nextDue: string | Date | null;
  type: string;
  frequencyDays: number;
  isActive: boolean;
  equipment?: {
    name: string;
    location?: {
      name: string;
    } | null;
  } | null;
}

interface SchedulesClientProps {
  schedules: Schedule[];
  initialMonth: number;
  initialYear: number;
}

type ViewType = "calendar" | "list" | "timeline";

const viewOptions = [
  { value: "calendar" as const, label: "Calendar", icon: CalendarIcon },
  { value: "list" as const, label: "List", icon: List },
  { value: "timeline" as const, label: "Timeline", icon: TimerIcon },
];

export function SchedulesClient({
  schedules,
  initialMonth,
  initialYear,
}: SchedulesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();

  const currentView = (searchParams.get("view") as ViewType) || "calendar";

  const handleNavigate = (month: number, year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month.toString());
    params.set("year", year.toString());
    router.push(`/maintenance/schedules?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleViewChange = (view: ViewType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/maintenance/schedules?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center rounded-lg border bg-muted/50 p-1">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleViewChange(option.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                currentView === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <option.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      {currentView === "calendar" && (
        <Calendar
          month={initialMonth}
          year={initialYear}
          events={schedules}
          getEventDate={(s) => (s.nextDue ? new Date(s.nextDue) : null)}
          onNavigate={handleNavigate}
          renderDayEvent={(event) => {
            const isOverdue = event.nextDue && new Date(event.nextDue) < today;
            return (
              <Link
                key={event.id}
                href={`/maintenance/schedules/${event.id}`}
                className={cn(
                  "block p-2 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-l-4 shadow-md",
                  isOverdue
                    ? "bg-rose-50 border-rose-600 text-rose-950"
                    : event.type === "maintenance"
                      ? "bg-amber-50 border-amber-500 text-amber-950"
                      : "bg-primary-50 border-primary-500 text-primary-950"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider truncate leading-tight flex items-center gap-1">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        isOverdue
                          ? "bg-rose-600"
                          : event.type === "maintenance"
                            ? "bg-amber-500"
                            : "bg-primary-500"
                      )}
                    />
                    {event.equipment?.name || "System"}
                  </span>
                  <span className="text-[11px] font-black truncate leading-tight">
                    {event.title}
                  </span>
                </div>
              </Link>
            );
          }}
          renderAgendaItem={(schedule, index) => (
            <AgendaItem
              key={schedule.id}
              schedule={schedule}
              today={today}
              index={index}
            />
          )}
        />
      )}

      {currentView === "list" && <SchedulesTable schedules={schedules} />}

      {currentView === "timeline" && (
        <SchedulesTimeline schedules={schedules} />
      )}
    </div>
  );
}

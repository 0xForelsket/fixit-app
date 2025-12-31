"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { AgendaItem } from "./agenda-item";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SchedulesClientProps {
  schedules: any[];
  initialMonth: number;
  initialYear: number;
}

export function SchedulesClient({ schedules, initialMonth, initialYear }: SchedulesClientProps) {
  const router = useRouter();
  const today = new Date();

  const handleNavigate = (month: number, year: number) => {
    router.push(`/maintenance/schedules?month=${month}&year=${year}`, { scroll: false });
  };

  return (
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
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isOverdue ? "bg-rose-600" : event.type === "maintenance" ? "bg-amber-500" : "bg-primary-500"
                )} />
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
  );
}

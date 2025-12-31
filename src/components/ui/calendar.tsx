"use client";

import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "./button";

const MONTH_NAMES = [
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

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface CalendarProps<T> {
  month: number;
  year: number;
  events: T[];
  getEventDate: (event: T) => Date | null;
  renderDayEvent: (event: T) => React.ReactNode;
  renderAgendaItem: (event: T, index: number) => React.ReactNode;
  onNavigate?: (month: number, year: number) => void;
  className?: string;
}

export function Calendar<T>({
  month,
  year,
  events,
  getEventDate,
  renderDayEvent,
  renderAgendaItem,
  onNavigate,
  className,
}: CalendarProps<T>) {
  const today = useMemo(() => new Date(), []);

  const { weeks } = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Create an array of days [null, null, 1, 2, ..., 31, null] to fill the grid
    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= days; i++) {
      grid.push(i);
    }
    const remaining = (7 - (grid.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      grid.push(null);
    }

    return {
      weeks: grid,
    };
  }, [month, year]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, T[]>();
    for (const event of events) {
      const date = getEventDate(event);
      if (date && date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        const existing = map.get(day) || [];
        existing.push(event);
        map.set(day, existing);
      }
    }
    return map;
  }, [events, month, year, getEventDate]);

  const handlePrevMonth = () => {
    if (!onNavigate) return;
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onNavigate(newMonth, newYear);
  };

  const handleNextMonth = () => {
    if (!onNavigate) return;
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onNavigate(newMonth, newYear);
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter text-foreground italic flex items-baseline gap-3">
            {MONTH_NAMES[month]}
            <span className="text-muted-foreground/50 not-italic font-sans text-3xl md:text-5xl font-black">
              {year}
            </span>
          </h2>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-1 p-1 rounded-full bg-card/50 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="h-12 w-16 rounded-l-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-white/10" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="h-12 w-16 rounded-r-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Agenda View */}
      <div className="lg:hidden space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-black italic text-foreground leading-none">
            Agenda
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="font-black text-[10px] uppercase tracking-widest h-8 px-3 bg-muted/50 rounded-full border border-black/5"
          >
            <Filter className="h-3 w-3 mr-1.5" /> Filter
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center rounded-3xl border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm">
            <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-black text-xs uppercase tracking-widest text-muted-foreground/60">
              No events scheduled
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event, index) => renderAgendaItem(event, index))}
          </div>
        )}
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block relative group">
        <div className="rounded-[2.5rem] border border-black/[0.08] dark:border-white/10 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-black/[0.08] dark:border-white/10 bg-muted/30">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="py-5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-muted-foreground/40 text-center border-r border-black/[0.08] dark:border-white/10 last:border-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 bg-white/5 gap-px">
            {weeks.map((day, i) => {
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const dayEvents = day ? eventsByDay.get(day) || [] : [];

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[160px] p-4 transition-all duration-300 relative group/cell",
                    "border-r border-b border-black/[0.08] dark:border-white/10", // Stronger borders
                    i % 7 === 6 && "border-r-0",
                    Math.floor(i / 7) === Math.floor((weeks.length - 1) / 7) &&
                      "border-b-0",
                    day
                      ? "bg-card/60 hover:bg-muted/30"
                      : "bg-zinc-900/[0.03] industrial-grid opacity-60",
                    isToday &&
                      "bg-white/10 ring-2 ring-inset ring-primary/40 shadow-[inset_0_0_40px_rgba(var(--primary),0.08)]"
                  )}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={cn(
                            "text-sm font-black font-mono tracking-tighter transition-colors",
                            isToday
                              ? "text-primary brightness-125"
                              : "text-zinc-600 dark:text-zinc-400 group-hover/cell:text-zinc-900 dark:group-hover/cell:text-zinc-100"
                          )}
                        >
                          {day.toString().padStart(2, "0")}
                        </span>
                        {isToday && (
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-primary relative z-10 shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar pr-1">
                        {dayEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className="animate-in fade-in zoom-in-95 duration-200 fill-mode-both"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            {renderDayEvent(event)}
                          </div>
                        ))}
                      </div>

                      {/* Hover action indicator */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <div className="p-1 rounded-md bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                          <Plus className="w-3 h-3 text-muted-foreground group-hover/cell:text-primary" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Settings, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Schedule {
  id: string;
  title: string;
  type: string;
  nextDue: string | Date | null;
  equipment?: {
    name: string;
  } | null;
}

interface SchedulesTimelineProps {
  schedules: Schedule[];
}

export function SchedulesTimeline({ schedules }: SchedulesTimelineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate the start of the visible range (Monday of current week + offset)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startDate = new Date(getStartOfWeek(today));
  startDate.setDate(startDate.getDate() + weekOffset * 7);

  // Show 8 weeks
  const numWeeks = 8;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numWeeks * 7);

  // Generate week labels
  const weeks: { start: Date; label: string }[] = [];
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    weeks.push({
      start: weekStart,
      label: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  }

  // Filter and sort schedules that have due dates
  const schedulesWithDates = schedules
    .filter((s) => s.nextDue)
    .map((s) => ({
      ...s,
      dueDate: new Date(s.nextDue!),
    }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Group by equipment
  const equipmentGroups = new Map<string, typeof schedulesWithDates>();
  for (const schedule of schedulesWithDates) {
    const equipmentName = schedule.equipment?.name || "Unassigned";
    if (!equipmentGroups.has(equipmentName)) {
      equipmentGroups.set(equipmentName, []);
    }
    equipmentGroups.get(equipmentName)!.push(schedule);
  }

  // Calculate position for a date
  const getPosition = (date: Date) => {
    const totalDays = numWeeks * 7;
    const daysSinceStart = Math.floor(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (daysSinceStart / totalDays) * 100;
  };

  // Calculate today position
  const todayPosition = getPosition(today);
  const showTodayLine = todayPosition >= 0 && todayPosition <= 100;

  if (schedulesWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Wrench className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No scheduled maintenance</h3>
        <p className="text-sm text-muted-foreground">
          No maintenance schedules with due dates to display
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev - 4)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <div className="text-sm font-medium text-muted-foreground">
          {startDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}{" "}
          -{" "}
          {endDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev + 4)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Week headers */}
        <div className="flex border-b bg-muted/50">
          <div className="w-48 shrink-0 p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r">
            Equipment
          </div>
          <div className="flex-1 flex relative">
            {weeks.map((week, i) => (
              <div
                key={week.label}
                className={cn(
                  "flex-1 p-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground",
                  i < weeks.length - 1 && "border-r border-dashed"
                )}
              >
                {week.label}
              </div>
            ))}
          </div>
        </div>

        {/* Equipment rows */}
        <div className="divide-y">
          {Array.from(equipmentGroups.entries()).map(
            ([equipmentName, groupSchedules]) => (
              <div key={equipmentName} className="flex min-h-[60px]">
                {/* Equipment name */}
                <div className="w-48 shrink-0 p-3 border-r bg-muted/30 flex items-center">
                  <span className="text-sm font-medium truncate">
                    {equipmentName}
                  </span>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative py-2 px-1">
                  {/* Week grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {weeks.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1",
                          i < weeks.length - 1 && "border-r border-dashed"
                        )}
                      />
                    ))}
                  </div>

                  {/* Today line */}
                  {showTodayLine && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary-500 z-10"
                      style={{ left: `${todayPosition}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-500" />
                    </div>
                  )}

                  {/* Schedule markers */}
                  <div className="relative h-full flex items-center gap-1 flex-wrap">
                    {groupSchedules.map((schedule) => {
                      const position = getPosition(schedule.dueDate);
                      const isVisible = position >= -5 && position <= 105;
                      const isOverdue = schedule.dueDate < today;
                      const isDueSoon =
                        !isOverdue &&
                        schedule.dueDate.getTime() - today.getTime() <
                          7 * 24 * 60 * 60 * 1000;

                      if (!isVisible) return null;

                      return (
                        <Link
                          key={schedule.id}
                          href={`/maintenance/schedules/${schedule.id}`}
                          className={cn(
                            "absolute h-8 min-w-[80px] max-w-[150px] rounded-md px-2 py-1 text-[10px] font-bold truncate transition-all hover:scale-105 hover:z-20 shadow-sm border",
                            isOverdue
                              ? "bg-rose-100 border-rose-300 text-rose-800"
                              : isDueSoon
                                ? "bg-amber-100 border-amber-300 text-amber-800"
                                : "bg-primary-100 border-primary-300 text-primary-800"
                          )}
                          style={{
                            left: `${Math.max(0, Math.min(position, 85))}%`,
                          }}
                          title={`${schedule.title} - Due ${schedule.dueDate.toLocaleDateString()}`}
                        >
                          <div className="flex items-center gap-1">
                            {schedule.type === "maintenance" ? (
                              <Wrench className="h-3 w-3 shrink-0" />
                            ) : (
                              <Settings className="h-3 w-3 shrink-0" />
                            )}
                            <span className="truncate">{schedule.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 p-3 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
            <span className="text-xs text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
            <span className="text-xs text-muted-foreground">
              Due within 7 days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary-100 border border-primary-300" />
            <span className="text-xs text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-0.5 bg-primary-500" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

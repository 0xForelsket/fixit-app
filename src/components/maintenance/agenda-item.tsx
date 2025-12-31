"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, MonitorCog, Settings, Wrench } from "lucide-react";
import Link from "next/link";

interface AgendaItemProps {
  schedule: {
    id: number;
    title: string;
    type: string;
    nextDue: Date | null;
    equipment?: { name: string } | null;
  };
  today: Date;
  index: number;
}

export function AgendaItem({ schedule, today, index }: AgendaItemProps) {
  const dueDate = schedule.nextDue ? new Date(schedule.nextDue) : null;
  const isOverdue = dueDate && dueDate < today;
  const daysUntil = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Link
      href={`/maintenance/schedules/${schedule.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-md p-5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]",
        isOverdue
          ? "border-rose-500/30 bg-rose-500/5 shadow-rose-500/5"
          : "hover:bg-muted/10",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative z-10 flex items-center gap-5">
        {/* Type Icon */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all group-hover:rotate-6 group-hover:scale-110",
            isOverdue
              ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              : "bg-zinc-800 border-zinc-700 text-zinc-100 dark:bg-zinc-100 dark:border-zinc-200 dark:text-zinc-900"
          )}
        >
          {schedule.type === "maintenance" ? (
            <Wrench className="h-7 w-7" />
          ) : (
            <Settings className="h-7 w-7" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <h3 className="text-lg font-serif font-black tracking-tight text-foreground truncate uppercase">
              {schedule.title}
            </h3>
            <Badge
              variant={isOverdue ? "destructive" : "outline"}
              className={cn(
                "rounded-full font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 border-2",
                !isOverdue && "border-white/10 text-muted-foreground"
              )}
            >
              {isOverdue ? "Overdue" : "Scheduled"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
            <div className="flex items-center gap-1.5">
              <MonitorCog className="h-3 w-3" />
              {schedule.equipment?.name || "System"}
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {isOverdue ? "Expired" : `${daysUntil} Days Left`}
            </div>
          </div>
        </div>

        {/* Action Icon */}
        <div className="p-2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Link>
  );
}

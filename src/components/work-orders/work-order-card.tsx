"use client";

import { Badge } from "@/components/ui/badge";
import type { Equipment, User, WorkOrder } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getPriorityConfig, getStatusConfig } from "@/lib/utils/work-orders";
import { ArrowRight, Timer } from "lucide-react";
import Link from "next/link";

export type WorkOrderWithRelations = WorkOrder & {
  equipment: (Equipment & { location: { name: string } | null }) | null;
  reportedBy: User | null;
  assignedTo: User | null;
};

interface WorkOrderCardProps {
  workOrder: WorkOrderWithRelations;
  index?: number;
}

export function WorkOrderCard({
  workOrder,
  variant = "default",
  index = 0,
}: WorkOrderCardProps & { variant?: "default" | "compact" }) {
  const statusConfig = getStatusConfig(workOrder.status);
  const priorityConfig = getPriorityConfig(workOrder.priority);

  const staggerClass =
    index < 5
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";

  if (variant === "compact") {
    // We use left border color to indicate priority strongly
    const borderColorClass =
      {
        low: "border-l-slate-400",
        medium: "border-l-primary-500",
        high: "border-l-amber-500",
        critical: "border-l-rose-600",
      }[workOrder.priority.toLowerCase()] || "border-l-zinc-300";

    return (
      <Link
        href={`/maintenance/work-orders/${workOrder.id}`}
        className={cn(
          "block relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm active:scale-[0.99] transition-all animate-in fade-in slide-in-from-bottom-1",
          borderColorClass,
          staggerClass
        )}
      >
        {/* Header strip - More compact */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50/50 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-black text-zinc-500">
              #{String(workOrder.id).padStart(3, "0")}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0 h-4 border-zinc-200 bg-white shadow-none uppercase",
                priorityConfig.color
              )}
            >
              {priorityConfig.label.substr(0, 4)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0 h-4 border-zinc-200 bg-white shadow-none uppercase",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
            <Timer className="h-3 w-3" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
        </div>

        <div className="p-3">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-zinc-900 leading-snug mb-1">
              {workOrder.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span className="text-zinc-700 font-bold truncate max-w-[120px]">
                {workOrder.equipment?.name || "No Equipment"}
              </span>
              {workOrder.equipment?.location && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                    <ArrowRight className="h-3 w-3" />
                    {workOrder.equipment.location.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-50 mt-auto">
            <div className="flex items-center gap-2">
              {workOrder.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-zinc-100 border flex items-center justify-center text-[8px] font-bold text-zinc-600">
                    {workOrder.assignedTo.name[0]}
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {workOrder.assignedTo.name}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-zinc-400 italic">
                  Unassigned
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/maintenance/work-orders/${workOrder.id}`}
      className={cn(
        "block rounded-2xl border-2 bg-white p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2",
        workOrder.priority === "critical"
          ? "border-rose-200 shadow-rose-100/50"
          : "border-zinc-200",
        staggerClass
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-zinc-50 border-zinc-300 px-1.5 py-0"
        >
          #{String(workOrder.id).padStart(3, "0")}
        </Badge>
        <span
          className={cn(
            "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
            statusConfig.bg,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      <h3 className="font-bold text-lg leading-tight mb-1 text-zinc-900 line-clamp-2">
        {workOrder.title}
      </h3>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center rounded-md border-2 px-1.5 py-0 text-[10px] font-black uppercase tracking-tighter",
            priorityConfig.bg,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </span>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {formatRelativeTime(workOrder.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-6 w-6 rounded-full bg-zinc-100 border flex items-center justify-center text-[10px] font-bold shrink-0">
            {workOrder.assignedTo?.name?.[0] || "U"}
          </div>
          <span className="text-xs font-semibold truncate text-zinc-600">
            {workOrder.assignedTo?.name || "Unassigned"}
          </span>
        </div>
        <div className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
          Details
          <ArrowRight className="inline-block ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

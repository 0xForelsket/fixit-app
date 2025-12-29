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
    const borderColorClass =
      {
        low: "border-l-secondary-400",
        medium: "border-l-primary-500",
        high: "border-l-warning-500",
        critical: "border-l-danger-600",
      }[workOrder.priority.toLowerCase()] || "border-l-border";

    return (
      <Link
        href={`/maintenance/work-orders/${workOrder.id}`}
        className={cn(
          "block relative overflow-hidden rounded-xl border border-border bg-card shadow-sm active:scale-[0.99] transition-all animate-in fade-in slide-in-from-bottom-1 hover:shadow-md",
          borderColorClass,
          staggerClass
        )}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-black text-muted-foreground">
              #{String(workOrder.id).padStart(3, "0")}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0 h-4 border-border/50 bg-card shadow-none uppercase font-black tracking-tighter",
                priorityConfig.color
              )}
            >
              {priorityConfig.label.substr(0, 4)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0 h-4 border-border/50 bg-card shadow-none uppercase font-bold",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wide">
            <Timer className="h-3 w-3" />
            {formatRelativeTime(workOrder.createdAt)}
          </div>
        </div>

        <div className="p-3">
          <div className="mb-2">
            <h3 className="font-bold text-sm text-foreground leading-snug mb-1">
              {workOrder.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span className="text-foreground/80 font-bold truncate max-w-[150px]">
                {workOrder.equipment?.name || "Global Reference"}
              </span>
              {workOrder.equipment?.location && (
                <>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                    <ArrowRight className="h-3 w-3" />
                    {workOrder.equipment.location.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-auto">
            <div className="flex items-center gap-2">
              {workOrder.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                    {workOrder.assignedTo.name[0]}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {workOrder.assignedTo.name}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground/50 italic">
                  Waiting for assignment
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
        "block rounded-2xl border-2 bg-card p-4 shadow-sm hover:shadow-xl hover:border-border/80 transition-all active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2",
        workOrder.priority === "critical"
          ? "border-danger-200/50 shadow-danger-500/5"
          : "border-border",
        staggerClass
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <Badge
          variant="outline"
          className="font-mono text-[10px] bg-muted/50 border-border px-1.5 py-0 font-black"
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

      <h3 className="font-bold text-lg leading-tight mb-2 text-foreground line-clamp-2">
        {workOrder.title}
      </h3>

      <div className="flex items-center gap-2 mb-5">
        <span
          className={cn(
            "inline-flex items-center rounded-md border-2 px-2 py-0 text-[10px] font-black uppercase tracking-tighter",
            priorityConfig.bg,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </span>
        <span className="text-xs text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-tighter opacity-70">
          <Timer className="h-3 w-3" />
          {formatRelativeTime(workOrder.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shadow-inner shrink-0">
            {workOrder.assignedTo?.name?.[0] || "?"}
          </div>
          <span className="text-xs font-bold truncate text-muted-foreground">
            {workOrder.assignedTo?.name || "Unassigned"}
          </span>
        </div>
        <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm hover:bg-primary/20 transition-colors">
          Protocol
          <ArrowRight className="inline-block ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

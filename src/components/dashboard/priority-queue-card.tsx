"use client";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WorkOrder {
  id: number;
  title: string;
  priority: string;
  status: string;
  createdAt: Date;
  equipment: { name: string; location?: { name: string } | null };
  reportedBy: { name: string };
  assignedTo?: { name: string } | null;
}

interface PriorityQueueCardProps {
  workOrders: WorkOrder[];
}

export function PriorityQueueCard({ workOrders }: PriorityQueueCardProps) {
  return (
    <div className="space-y-3">
      {workOrders.map((workOrder) => {
        const priorityConfig = getPriorityConfig(workOrder.priority);
        // We use left border color to indicate priority strongly
        const borderColorClass = {
          low: "border-l-slate-400",
          medium: "border-l-primary-500",
          high: "border-l-amber-500",
          critical: "border-l-rose-600",
        }[workOrder.priority.toLowerCase()] || "border-l-zinc-300";

        return (
          <Link
            key={workOrder.id}
            href={`/dashboard/work-orders/${workOrder.id}`}
            className={cn(
              "block relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm active:scale-[0.99] transition-all",
              "border-l-[6px]", // Thick left border for priority
              borderColorClass
            )}
          >
            {/* Header strip */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50/50 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black text-zinc-500">
                        #{String(workOrder.id).padStart(3, "0")}
                    </span>
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 border-zinc-200 bg-white shadow-none", priorityConfig.text)}>
                        {priorityConfig.label}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(workOrder.createdAt)}
                </div>
            </div>
            
            <div className="p-4">
                <div className="mb-3">
                    <h3 className="font-bold text-base text-zinc-900 leading-snug mb-1">
                        {workOrder.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                        <span className="text-zinc-700 font-bold">{workOrder.equipment.name}</span>
                        {workOrder.equipment.location && (
                            <>
                                <span className="text-zinc-300">•</span>
                                <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                                    <MapPin className="h-3 w-3" />
                                    {workOrder.equipment.location.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-50 mt-auto">
                    <div className="flex items-center gap-2">
                        {workOrder.assignedTo ? (
                             <div className="flex items-center gap-1.5">
                                 <div className="h-5 w-5 rounded-full bg-zinc-100 border flex items-center justify-center text-[9px] font-bold text-zinc-600">
                                     {workOrder.assignedTo.name[0]}
                                 </div>
                                 <span className="text-[10px] font-semibold text-zinc-500">
                                     {workOrder.assignedTo.name}
                                 </span>
                             </div>
                        ) : (
                             <span className="text-[10px] font-medium text-zinc-400 italic">Unassigned</span>
                        )}
                    </div>
                    
                    <div className="flex items-center text-xs font-black text-primary-600 gap-1 bg-primary-50 px-2 py-1 rounded-md">
                        View
                        <ArrowRight className="h-3 w-3" />
                    </div>
                </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getPriorityConfig(priority: string) {
    const configs: Record<string, { text: string; label: string }> = {
      low: { text: "text-slate-600", label: "LOW" },
      medium: { text: "text-primary-600", label: "MED" },
      high: { text: "text-amber-600", label: "HIGH" },
      critical: { text: "text-rose-600", label: "CRIT" },
    };
    return configs[priority.toLowerCase()] || { text: "text-zinc-600", label: priority.toUpperCase().slice(0, 4) };
}

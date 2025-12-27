import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getPriorityConfig, getStatusConfig } from "@/lib/utils/work-orders";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { WorkOrderWithRelations } from "@/components/work-orders/work-order-card";

interface DashboardWorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
}

export function DashboardWorkOrderTable({
  workOrders,
}: DashboardWorkOrderTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm ring-1 ring-zinc-200">
      <table className="w-full">
        <thead className="border-b bg-zinc-50/50">
          <tr className="text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <th className="p-4">ID</th>
            <th className="p-4">Ticket</th>
            <th className="p-4">Equipment</th>
            <th className="p-4">Priority</th>
            <th className="p-4">Assigned To</th>
            <th className="p-4 text-right">Age</th>
            <th className="p-4 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {workOrders.map((workOrder) => {
            const priorityConfig = getPriorityConfig(workOrder.priority);
            const statusConfig = getStatusConfig(workOrder.status);

            return (
              <tr
                key={workOrder.id}
                className="group transition-colors hover:bg-zinc-50/80 cursor-pointer"
                onClick={() =>
                  router.push(`/maintenance/work-orders/${workOrder.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/maintenance/work-orders/${workOrder.id}`);
                  }
                }}
                tabIndex={0}
              >
                <td className="p-4">
                  <span className="font-mono text-xs font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">
                    #{String(workOrder.id).padStart(3, "0")}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-zinc-900 leading-tight group-hover:text-primary-600 transition-colors">
                      {workOrder.title}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 mt-0.5">
                      Reported by {workOrder.reportedBy?.name || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-zinc-700">
                      {workOrder.equipment?.name || "—"}
                    </span>
                    {workOrder.equipment?.location && (
                      <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[120px]">
                        {workOrder.equipment.location.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Badge
                      className={cn(
                        "rounded-md border px-1.5 py-0 text-[10px] font-black uppercase tracking-wider shadow-none",
                        priorityConfig.bg,
                        priorityConfig.color,
                        priorityConfig.border
                      )}
                    >
                      {priorityConfig.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md border px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider bg-white text-zinc-500",
                        statusConfig.border
                      )}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                </td>
                <td className="p-4">
                  {workOrder.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-zinc-100 border flex items-center justify-center text-[10px] font-bold text-zinc-600">
                        {workOrder.assignedTo.name[0]}
                      </div>
                      <span className="text-xs font-semibold text-zinc-600">
                        {workOrder.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-zinc-400 italic">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span className="font-mono text-xs font-medium text-zinc-500 tabular-nums">
                    {formatRelativeTime(workOrder.createdAt)}
                  </span>
                </td>
                <td className="p-4 pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-primary-600 transition-all"
                    asChild
                  >
                    <Link
                      href={`/maintenance/work-orders/${workOrder.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

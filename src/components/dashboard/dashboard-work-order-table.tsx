"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/utils";
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-border/50 transition-all duration-300">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/30">
          <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <th className="p-2">ID</th>
            <th className="p-2">Ticket Details</th>
            <th className="p-2">Unit / Asset</th>
            <th className="p-2">Priority Status</th>
            <th className="p-2">Responsible</th>
            <th className="p-2 text-right">Age</th>
            <th className="p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {workOrders.map((workOrder) => {
            return (
              <tr
                key={workOrder.id}
                className="group transition-all hover:bg-muted/40 cursor-pointer active:bg-muted/60"
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
                <td className="p-2">
                  <span className="font-mono text-[10px] font-black text-muted-foreground group-hover:text-primary transition-colors">
                    #{String(workOrder.id).padStart(3, "0")}
                  </span>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-foreground leading-tight group-hover:text-primary transition-colors">
                      {workOrder.title}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground mt-0.5">
                      By {workOrder.reportedBy?.name || "System"}
                    </span>
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-foreground/80">
                      {workOrder.equipment?.name || "Global Reference"}
                    </span>
                    {workOrder.equipment?.location && (
                      <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">
                        {workOrder.equipment.location.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge
                      status={workOrder.priority}
                      className="h-4 px-1 text-[8px]"
                    />
                    <StatusBadge
                      status={workOrder.status}
                      className="h-4 px-1 text-[8px]"
                    />
                  </div>
                </td>
                <td className="p-2">
                  {workOrder.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary shadow-inner">
                        {workOrder.assignedTo.name[0]}
                      </div>
                      <span className="text-[10px] font-bold text-foreground/70 group-hover:text-foreground transition-colors">
                        {workOrder.assignedTo.name.split(" ")[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground/40 italic">
                      None
                    </span>
                  )}
                </td>
                <td className="p-2 text-right">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                    {formatRelativeTime(workOrder.createdAt)}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[9px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all group-hover:border-primary/50"
                    asChild
                  >
                    <Link
                      href={`/maintenance/work-orders/${workOrder.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      PROTOCOL
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

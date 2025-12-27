"use client";

import { Badge } from "@/components/ui/badge";
import type { Equipment, User, WorkOrder } from "@/db/schema";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowRight, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Duplicate helper functions to avoid circular deps or move to a shared util later
// For now, inline or imported if they exist. Redefining for self-containment/speed.
function getStatusConfig(status: string) {
  const configs = {
    open: { label: "Open", color: "text-blue-700", bg: "bg-blue-50" },
    in_progress: {
      label: "In Progress",
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    resolved: { label: "Resolved", color: "text-green-700", bg: "bg-green-50" },
    closed: { label: "Closed", color: "text-slate-700", bg: "bg-slate-50" },
  };
  return (
    configs[status as keyof typeof configs] || {
      label: status,
      color: "text-gray-700",
      bg: "bg-gray-50",
    }
  );
}

function getPriorityConfig(priority: string) {
  const configs = {
    low: { label: "Low", color: "text-slate-700", bg: "bg-slate-100" },
    medium: { label: "Medium", color: "text-blue-700", bg: "bg-blue-100" },
    high: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
    critical: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
  };
  return (
    configs[priority as keyof typeof configs] || {
      label: priority,
      color: "text-gray-700",
      bg: "bg-gray-100",
    }
  );
}

type WorkOrderWithRelations = WorkOrder & {
  equipment: Equipment | null;
  reportedBy: User | null;
  assignedTo: User | null;
};

interface WorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
}

export function WorkOrderTable({ workOrders }: WorkOrderTableProps) {
  const router = useRouter();

  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b bg-slate-50">
          <tr className="text-left text-sm font-medium text-muted-foreground">
            <th className="p-4">ID</th>
            <th className="p-4">Work Order</th>
            <th className="p-4 hidden md:table-cell">Equipment</th>
            <th className="p-4 hidden lg:table-cell">Status</th>
            <th className="p-4 hidden lg:table-cell">Priority</th>
            <th className="p-4 hidden xl:table-cell">Assigned To</th>
            <th className="p-4 hidden sm:table-cell">Created</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {workOrders.map((workOrder) => (
            <WorkOrderRow key={workOrder.id} workOrder={workOrder} router={router} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkOrderRow({
  workOrder,
  router,
}: {
  workOrder: WorkOrderWithRelations;
  router: ReturnType<typeof useRouter>;
}) {
  const statusConfig = getStatusConfig(workOrder.status);
  const priorityConfig = getPriorityConfig(workOrder.priority);

  return (
    <tr
      className="group hover:bg-slate-50 transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/work-orders/${workOrder.id}`)}
    >
      <td className="p-4">
        <span className="font-mono text-xs font-bold text-zinc-500">
          #{String(workOrder.id).padStart(3, "0")}
        </span>
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-zinc-900 leading-tight group-hover:text-primary-600 transition-colors">
            {workOrder.title}
          </span>
          <span className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
            {workOrder.description}
          </span>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className="text-sm font-medium text-zinc-700">
          {workOrder.equipment?.name || "—"}
        </span>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <Badge
          className={`${statusConfig.bg} ${statusConfig.color} border-transparent font-bold uppercase text-[10px] tracking-wider hover:bg-opacity-80`}
        >
          {statusConfig.label}
        </Badge>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <Badge
          className={`${priorityConfig.bg} ${priorityConfig.color} border-transparent font-bold uppercase text-[10px] tracking-wider hover:bg-opacity-80`}
        >
          {priorityConfig.label}
        </Badge>
      </td>
      <td className="p-4 hidden xl:table-cell">
        <div className="flex items-center gap-2">
          {workOrder.assignedTo ? (
            <>
              <div className="h-6 w-6 rounded-full bg-zinc-100 border flex items-center justify-center text-[10px] font-bold text-zinc-600">
                {workOrder.assignedTo.name[0]}
              </div>
              <span className="text-sm text-zinc-600">
                {workOrder.assignedTo.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-zinc-400 italic">Unassigned</span>
          )}
        </div>
      </td>
      <td className="p-4 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <Timer className="h-3.5 w-3.5" />
          {formatRelativeTime(workOrder.createdAt)}
        </div>
      </td>
      <td className="p-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        >
          <Link href={`/dashboard/work-orders/${workOrder.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

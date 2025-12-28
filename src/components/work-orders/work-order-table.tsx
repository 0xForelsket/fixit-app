"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortHeader } from "@/components/ui/sort-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Equipment, User, WorkOrder } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getPriorityConfig, getStatusConfig } from "@/lib/utils/work-orders";
import { ArrowRight, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type WorkOrderWithRelations = WorkOrder & {
  equipment: Equipment | null;
  reportedBy: User | null;
  assignedTo: User | null;
};

interface WorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
  searchParams?: Record<string, string | undefined>;
}

export function WorkOrderTable({ workOrders, searchParams }: WorkOrderTableProps) {
  const router = useRouter();
  const params = searchParams || {};

  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-b text-left text-sm font-medium text-muted-foreground hover:bg-transparent">
            <SortHeader
              label="ID"
              field="id"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-4"
            />
            <SortHeader
              label="Work Order"
              field="title"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-4"
            />
            <TableHead className="p-4 hidden md:table-cell">Equipment</TableHead>
            <SortHeader
              label="Status"
              field="status"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-4 hidden lg:table-cell"
            />
            <SortHeader
              label="Priority"
              field="priority"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-4 hidden lg:table-cell"
            />
            <TableHead className="p-4 hidden xl:table-cell">Assigned To</TableHead>
            <SortHeader
              label="Created"
              field="createdAt"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-4 hidden sm:table-cell"
            />
            <TableHead className="p-4" />
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y">
          {workOrders.map((workOrder, index) => (
            <WorkOrderRow
              key={workOrder.id}
              workOrder={workOrder}
              router={router}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function WorkOrderRow({
  workOrder,
  router,
  index,
}: {
  workOrder: WorkOrderWithRelations;
  router: ReturnType<typeof useRouter>;
  index: number;
}) {
  const statusConfig = getStatusConfig(workOrder.status);
  const priorityConfig = getPriorityConfig(workOrder.priority);

  const staggerClass = index < 5 ? `animate-stagger-${index + 1}` : "animate-in fade-in duration-500";

  return (
    <TableRow
      className={cn("group hover:bg-slate-50 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1", staggerClass)}
      onClick={() => router.push(`/maintenance/work-orders/${workOrder.id}`)}
    >
      <TableCell className="p-4">
        <span className="font-mono text-xs font-bold text-zinc-500">
          #{String(workOrder.id).padStart(3, "0")}
        </span>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-zinc-900 leading-tight group-hover:text-primary-600 transition-colors">
            {workOrder.title}
          </span>
          <span className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
            {workOrder.description}
          </span>
        </div>
      </TableCell>
      <TableCell className="p-4 hidden md:table-cell">
        <span className="text-sm font-medium text-zinc-700">
          {workOrder.equipment?.name || "—"}
        </span>
      </TableCell>
      <TableCell className="p-4 hidden lg:table-cell">
        <Badge
          className={`${statusConfig.bg} ${statusConfig.color} border-transparent font-bold uppercase text-[10px] tracking-wider hover:bg-opacity-80`}
        >
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="p-4 hidden lg:table-cell">
        <Badge
          className={`${priorityConfig.bg} ${priorityConfig.color} border-transparent font-bold uppercase text-[10px] tracking-wider hover:bg-opacity-80`}
        >
          {priorityConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="p-4 hidden xl:table-cell">
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
      </TableCell>
      <TableCell className="p-4 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <Timer className="h-3.5 w-3.5" />
          {formatRelativeTime(workOrder.createdAt)}
        </div>
      </TableCell>
      <TableCell className="p-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        >
          <Link href={`/maintenance/work-orders/${workOrder.id}`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

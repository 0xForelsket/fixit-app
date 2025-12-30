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
import { cn, formatRelativeTime } from "@/lib/utils";
import { getPriorityConfig, getStatusConfig } from "@/lib/utils/work-orders";
// ArrowRight and Timer were unused
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkOrderWithRelations } from "./work-order-card";

interface WorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
  searchParams?: Record<string, string | undefined>;
}

export function WorkOrderTable({
  workOrders,
  searchParams,
}: WorkOrderTableProps) {
  const router = useRouter();
  const params = searchParams || {};

  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-transparent">
            <SortHeader
              label="ID"
              field="id"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-3 w-[80px]"
            />
            <SortHeader
              label="Work Order"
              field="title"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-3"
            />
            <TableHead className="p-3 hidden md:table-cell">
              Equipment
            </TableHead>
            <SortHeader
              label="Status"
              field="status"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-3 hidden lg:table-cell"
            />
            <SortHeader
              label="Priority"
              field="priority"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-3 hidden lg:table-cell"
            />
            <TableHead className="p-3 hidden xl:table-cell">
              Assigned To
            </TableHead>
            <SortHeader
              label="Created"
              field="createdAt"
              currentSort={params.sort}
              currentDir={params.dir}
              params={params}
              className="p-3 hidden sm:table-cell text-right"
            />
            <TableHead className="p-3 w-[100px] text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
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

  const staggerClass =
    index < 5
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";

  return (
    <TableRow
      className={cn(
        "group hover:bg-muted/50 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 text-xs",
        staggerClass
      )}
      onClick={() => router.push(`/maintenance/work-orders/${workOrder.id}`)}
    >
      <TableCell className="p-3 font-mono font-bold text-muted-foreground">
        #{String(workOrder.id).padStart(3, "0")}
      </TableCell>
      <TableCell className="p-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {workOrder.title}
          </span>
          <span className="text-[10px] text-muted-foreground line-clamp-1 font-medium">
            {workOrder.description || "No description provided"}
          </span>
        </div>
      </TableCell>
      <TableCell className="p-3 hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-bold text-foreground/80 line-clamp-1">
            {workOrder.equipment?.name || "—"}
          </span>
          {workOrder.equipment?.location && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {workOrder.equipment.location.name}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="p-3 hidden lg:table-cell">
        <Badge
          variant="outline"
          className={cn(
            "border-transparent font-black uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full shadow-sm",
            statusConfig.bg,
            statusConfig.color
          )}
        >
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="p-3 hidden lg:table-cell">
        <Badge
          variant="outline"
          className={cn(
            "border-transparent font-black uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full shadow-sm",
            priorityConfig.bg,
            priorityConfig.color
          )}
        >
          {priorityConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="p-3 hidden xl:table-cell">
        <div className="flex items-center gap-2">
          {workOrder.assignedTo ? (
            <>
              <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary">
                {workOrder.assignedTo.name[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-foreground leading-none">
                  {workOrder.assignedTo.name.split(" ")[0]}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium italic px-2 py-0.5 rounded-full bg-muted">
              Unassigned
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="p-3 hidden sm:table-cell text-right">
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          {formatRelativeTime(workOrder.createdAt)}
        </div>
      </TableCell>
      <TableCell className="p-3 text-center">
        <Button
          size="sm"
          className="h-7 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none"
          asChild
        >
          <Link href={`/maintenance/work-orders/${workOrder.id}`}>VIEW</Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

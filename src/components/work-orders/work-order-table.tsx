"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getPriorityConfig, getStatusConfig } from "@/lib/utils/work-orders";
import Link from "next/link";
import type { WorkOrderWithRelations } from "./work-order-card";

interface WorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
  searchParams?: Record<string, string | undefined>;
}

/**
 * Work Order Table using the reusable DataTable component.
 */
export function WorkOrderTable({
  workOrders,
  searchParams,
}: WorkOrderTableProps) {
  const columns: ColumnDef<WorkOrderWithRelations>[] = [
    {
      id: "id",
      header: "ID",
      sortable: true,
      width: "80px",
      cell: (row) => (
        <span className="font-mono font-bold text-muted-foreground">
          #{String(row.id).padStart(3, "0")}
        </span>
      ),
    },
    {
      id: "title",
      header: "Work Order",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {row.title}
          </span>
          <span className="text-[10px] text-muted-foreground line-clamp-1 font-medium">
            {row.description || "No description provided"}
          </span>
        </div>
      ),
    },
    {
      id: "equipment",
      header: "Equipment",
      hideBelow: "md",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground/80 line-clamp-1">
            {row.equipment?.name || "—"}
          </span>
          {row.equipment?.location && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {row.equipment.location.name}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => {
        const statusConfig = getStatusConfig(row.status);
        return (
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
        );
      },
    },
    {
      id: "priority",
      header: "Priority",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => {
        const priorityConfig = getPriorityConfig(row.priority);
        return (
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
        );
      },
    },
    {
      id: "assignedTo",
      header: "Assigned To",
      hideBelow: "xl",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.assignedTo ? (
            <>
              <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary">
                {row.assignedTo.name[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-foreground leading-none">
                  {row.assignedTo.name.split(" ")[0]}
                </span>
              </div>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium italic px-2 py-0.5 rounded-full bg-muted">
              Unassigned
            </span>
          )}
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      align: "right",
      hideBelow: "sm",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          {formatRelativeTime(row.createdAt)}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "center",
      width: "100px",
      resizable: false,
      cell: (row) => (
        <Button
          size="sm"
          className="h-7 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none"
          asChild
        >
          <Link
            href={`/maintenance/work-orders/${row.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            VIEW
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="hidden lg:block">
      <DataTable
        columns={columns}
        data={workOrders}
        searchParams={searchParams}
        getRowId={(row) => row.id}
        getRowHref={(row) => `/maintenance/work-orders/${row.id}`}
        emptyMessage="No work orders found"
        compact
      />
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

import type { WorkOrderWithRelations } from "@/components/work-orders/work-order-card";

interface DashboardWorkOrderTableProps {
  workOrders: WorkOrderWithRelations[];
}

export function DashboardWorkOrderTable({
  workOrders,
}: DashboardWorkOrderTableProps) {
  const columns: ColumnDef<WorkOrderWithRelations>[] = [
    {
      id: "id",
      header: "ID",
      width: "60px",
      cell: (row) => (
        <span className="font-mono text-[10px] font-black text-muted-foreground group-hover:text-primary transition-colors">
          #{String(row.id).padStart(3, "0")}
        </span>
      ),
    },
    {
      id: "title",
      header: "Ticket Details",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-foreground leading-tight group-hover:text-primary transition-colors">
            {row.title}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground mt-0.5">
            By {row.reportedBy?.name || "System"}
          </span>
        </div>
      ),
    },
    {
      id: "equipment",
      header: "Unit / Asset",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-[10px] text-foreground/80">
            {row.equipment?.name || "Global Reference"}
          </span>
          {row.equipment?.location && (
            <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">
              {row.equipment.location.name}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priority Status",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={row.priority} className="h-4 px-1 text-[8px]" />
          <StatusBadge status={row.status} className="h-4 px-1 text-[8px]" />
        </div>
      ),
    },
    {
      id: "assignedTo",
      header: "Responsible",
      cell: (row) =>
        row.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary shadow-inner">
              {row.assignedTo.name[0]}
            </div>
            <span className="text-[10px] font-bold text-foreground/70 group-hover:text-foreground transition-colors">
              {row.assignedTo.name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground/40 italic">
            None
          </span>
        ),
    },
    {
      id: "createdAt",
      header: "Age",
      align: "right",
      cell: (row) => (
        <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "center",
      width: "80px",
      resizable: false,
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[9px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all group-hover:border-primary/50"
          asChild
        >
          <Link
            href={`/maintenance/work-orders/${row.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            PROTOCOL
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={workOrders}
      getRowId={(row) => row.id}
      getRowHref={(row) => `/maintenance/work-orders/${row.id}`}
      emptyMessage="No active work orders"
      compact
      className="rounded-2xl shadow-xl ring-1 ring-border/50"
    />
  );
}

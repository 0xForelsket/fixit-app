"use client";

import { Inbox } from "lucide-react";
import { WorkOrderCard } from "./work-order-card";
import { WorkOrderTable } from "./work-order-table";

import type { WorkOrderWithRelations } from "./work-order-card";

interface WorkOrderListProps {
  workOrders: WorkOrderWithRelations[];
  emptyMessage?: string;
}

export function WorkOrderList({
  workOrders,
  emptyMessage,
}: WorkOrderListProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-white shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 border shadow-inner">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No work orders found</h3>
        <p className="text-sm text-muted-foreground">
          {emptyMessage || "Try adjusting your filters"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <WorkOrderTable workOrders={workOrders} />

      {/* Mobile Feed */}
      <div className="lg:hidden space-y-3">
        {workOrders.map((workOrder) => (
          <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
        ))}
      </div>
    </>
  );
}

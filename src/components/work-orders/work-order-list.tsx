"use client";

import { Inbox } from "lucide-react";
import { WorkOrderCard } from "./work-order-card";
import { WorkOrderTable } from "./work-order-table";
import { EmptyState } from "@/components/ui/empty-state";

import type { WorkOrderWithRelations } from "./work-order-card";

interface WorkOrderListProps {
  workOrders: WorkOrderWithRelations[];
  emptyMessage?: string;
  searchParams?: Record<string, string | undefined>;
}

export function WorkOrderList({
  workOrders,
  emptyMessage,
  searchParams,
}: WorkOrderListProps) {
  if (workOrders.length === 0) {
    return (
      <EmptyState
        title="No work orders found"
        description={emptyMessage || "Try adjusting your filters to find specific maintenance tasks."}
        icon={Inbox}
      />
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <WorkOrderTable workOrders={workOrders} searchParams={searchParams} />

      {/* Mobile Feed */}
      <div className="lg:hidden space-y-3">
        {workOrders.map((workOrder, index) => (
          <WorkOrderCard key={workOrder.id} workOrder={workOrder} index={index} />
        ))}
      </div>
    </>
  );
}

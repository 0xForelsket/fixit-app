"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { useCallback, useState } from "react";
import { BulkActionsBar } from "./bulk-actions-bar";
import { WorkOrderCard } from "./work-order-card";
import { WorkOrderTable } from "./work-order-table";

import type { WorkOrderWithRelations } from "./work-order-card";

interface WorkOrderListProps {
  workOrders: WorkOrderWithRelations[];
  emptyMessage?: string;
  searchParams?: Record<string, string | undefined>;
  technicians?: { id: string; name: string }[];
}

export function WorkOrderList({
  workOrders,
  emptyMessage,
  searchParams,
  technicians = [],
}: WorkOrderListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === workOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(workOrders.map((wo) => wo.id));
    }
  }, [selectedIds.length, workOrders]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  if (workOrders.length === 0) {
    return (
      <EmptyState
        title="No work orders found"
        description={
          emptyMessage ||
          "Try adjusting your filters to find specific maintenance tasks."
        }
        icon={Inbox}
      />
    );
  }

  return (
    <>
      {/* Desktop Table with Selection */}
      <WorkOrderTable
        workOrders={workOrders}
        searchParams={searchParams}
        selectable
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />

      {/* Mobile Feed */}
      <div className="lg:hidden space-y-3">
        {workOrders.map((workOrder, index) => (
          <div key={workOrder.id} className="relative">
            {/* Mobile selection checkbox */}
            <button
              type="button"
              onClick={() => handleSelect(workOrder.id)}
              className={cn(
                "absolute left-2 top-2 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                selectedIds.includes(workOrder.id)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {selectedIds.includes(workOrder.id) && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <WorkOrderCard workOrder={workOrder} index={index} />
          </div>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={handleClearSelection}
        technicians={technicians}
      />
    </>
  );
}

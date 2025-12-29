"use client";

import {
  WorkOrderCard,
  type WorkOrderWithRelations,
} from "@/components/work-orders/work-order-card";
import { CheckCircle2 } from "lucide-react";
import { DashboardWorkOrderTable } from "./dashboard-work-order-table";

interface DashboardWorkOrderFeedProps {
  workOrders: WorkOrderWithRelations[];
}

export function DashboardWorkOrderFeed({
  workOrders,
}: DashboardWorkOrderFeedProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-success/30 bg-success/5 p-12 text-center animate-in backdrop-blur-sm shadow-inner overflow-hidden relative group">
        {/* Background glow */}
        <div className="absolute inset-0 bg-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[60px]" />
        
        <div className="relative">
          <div className="absolute inset-0 bg-success/20 rounded-full blur-[40px] animate-pulse" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card border-2 border-success/20 shadow-xl transition-transform group-hover:scale-110 duration-500">
            <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
          </div>
        </div>
        
        <div className="relative z-10 space-y-2 mt-6">
          <h3 className="text-xl font-black text-foreground tracking-[.15em] uppercase font-serif">
            System Nominal
          </h3>
          <p className="text-muted-foreground font-mono text-[9px] uppercase font-bold tracking-widest leading-relaxed">
            All systems operational. No active tickets found.
          </p>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-success/20 to-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DashboardWorkOrderTable workOrders={workOrders} />
      </div>

      {/* Mobile/Tablet Card Feed View */}
      <div className="space-y-4 lg:hidden">
        {workOrders.map((workOrder) => (
          <WorkOrderCard
            key={workOrder.id}
            workOrder={workOrder}
            variant="compact"
          />
        ))}
      </div>
    </>
  );
}

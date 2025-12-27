"use client";

import { CheckCircle2 } from "lucide-react";
import { PriorityQueueTable } from "./priority-queue-table";
import { PriorityQueueCard } from "./priority-queue-card";

interface WorkOrder {
  id: number;
  title: string;
  priority: string;
  status: string;
  createdAt: Date;
  equipment: { name: string; location?: { name: string } | null };
  reportedBy: { name: string };
  assignedTo?: { name: string } | null;
}

interface PriorityQueueProps {
  workOrders: WorkOrder[];
}

export function PriorityQueue({ workOrders }: PriorityQueueProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-success-200 bg-success-50/30 p-16 text-center animate-in backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-success-400/20 rounded-full blur-[40px] animate-gentle-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-success-400/20 to-success-500/20 border border-success-200 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-success-600" />
          </div>
        </div>
        <h3 className="mt-8 text-2xl font-black text-success-900 tracking-tight">
          SYSTEM NOMINAL
        </h3>
        <p className="text-success-700 font-medium mt-1">
          No open work orders requiring urgent attention.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <PriorityQueueTable workOrders={workOrders} />
      </div>

      {/* Mobile/Tablet Card Feed View */}
      <div className="lg:hidden">
        <PriorityQueueCard workOrders={workOrders} />
      </div>
    </>
  );
}

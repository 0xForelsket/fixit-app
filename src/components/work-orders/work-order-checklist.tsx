"use client";

import { updateChecklistItem } from "@/actions/workOrders";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Info } from "lucide-react";
import { useState } from "react";
import type { ChecklistItemStatus } from "@/db/schema";

interface ChecklistItem {
  id: number;
  status: ChecklistItemStatus;
  notes: string | null;
  checklist: {
    stepNumber: number;
    description: string;
    isRequired: boolean;
    estimatedMinutes: number | null;
  };
}

interface WorkOrderChecklistProps {
  workOrderId: number;
  items: ChecklistItem[];
}

export function WorkOrderChecklist({
  workOrderId,
  items: initialItems,
}: WorkOrderChecklistProps) {
  const [items, setItems] = useState(initialItems);
  const [updating, setUpdating] = useState<number | null>(null);
  const { toast } = useToast();

  const totalSteps = items.length;
  const completedSteps = items.filter((i) => i.status === "completed").length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const toggleItem = async (item: ChecklistItem) => {
    const newStatus: ChecklistItemStatus =
      item.status === "completed" ? "pending" : "completed";
    
    setUpdating(item.id);
    try {
      const result = await updateChecklistItem(item.id, workOrderId, {
        status: newStatus,
      });

      if (result.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: newStatus } : i
          )
        );
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Could not update checklist item",
          variant: "destructive",
        });
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center bg-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
          <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Checklist</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          This work order doesn't have a standardized procedure attached.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Procedure Progress</h3>
          <span className="text-sm font-bold text-primary-600">
            {completedSteps} / {totalSteps} Steps
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-4 p-4 transition-colors",
              item.status === "completed" ? "bg-slate-50/50" : "hover:bg-slate-50/30"
            )}
          >
            <div className="pt-1">
              <button
                type="button"
                disabled={updating === item.id}
                onClick={() => toggleItem(item)}
                className={cn(
                  "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  item.status === "completed"
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "border-slate-300 bg-white hover:border-primary-500",
                  updating === item.id && "opacity-50 cursor-wait"
                )}
              >
                {item.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4 opacity-0" />
                )}
              </button>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-4">
                <p
                  className={cn(
                    "font-medium leading-tight",
                    item.status === "completed" && "text-muted-foreground line-through"
                  )}
                >
                  {item.checklist.description}
                </p>
                {item.checklist.isRequired && (
                  <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                    Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-bold">Step {item.checklist.stepNumber}</span>
                </span>
                {item.checklist.estimatedMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.checklist.estimatedMinutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

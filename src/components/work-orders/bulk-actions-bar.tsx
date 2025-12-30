"use client";

import { bulkUpdateWorkOrders } from "@/actions/workOrders";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BulkActionsBarProps {
  selectedIds: number[];
  onClear: () => void;
  technicians: { id: number; name: string }[];
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export function BulkActionsBar({
  selectedIds,
  onClear,
  technicians,
}: BulkActionsBarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleBulkUpdate = async (
    update: {
      status?: (typeof statusOptions)[number]["value"];
      priority?: (typeof priorityOptions)[number]["value"];
      assignedToId?: number | null;
    },
    actionLabel: string
  ) => {
    startTransition(async () => {
      const result = await bulkUpdateWorkOrders({
        ids: selectedIds,
        ...update,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.data?.updated} work order(s) ${actionLabel}`,
        });
        onClear();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });

    setOpenDropdown(null);
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-2 bg-foreground text-background px-4 py-3 rounded-full shadow-2xl border border-background/10">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-background/20">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">
            {selectedIds.length}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Selected
          </span>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-background hover:bg-background/10 hover:text-background"
            onClick={() =>
              setOpenDropdown(openDropdown === "status" ? null : "status")
            }
            disabled={isPending}
          >
            <CheckCircle2 className="mr-1.5 h-3 w-3" />
            Status
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          {openDropdown === "status" && (
            <div className="absolute bottom-full left-0 mb-2 w-40 rounded-lg border bg-popover text-popover-foreground shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted transition-colors"
                  onClick={() =>
                    handleBulkUpdate(
                      { status: option.value },
                      `updated to ${option.label}`
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-background hover:bg-background/10 hover:text-background"
            onClick={() =>
              setOpenDropdown(openDropdown === "priority" ? null : "priority")
            }
            disabled={isPending}
          >
            <AlertTriangle className="mr-1.5 h-3 w-3" />
            Priority
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          {openDropdown === "priority" && (
            <div className="absolute bottom-full left-0 mb-2 w-40 rounded-lg border bg-popover text-popover-foreground shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted transition-colors"
                  onClick={() =>
                    handleBulkUpdate(
                      { priority: option.value },
                      `set to ${option.label} priority`
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-background hover:bg-background/10 hover:text-background"
            onClick={() =>
              setOpenDropdown(openDropdown === "assign" ? null : "assign")
            }
            disabled={isPending}
          >
            <User className="mr-1.5 h-3 w-3" />
            Assign
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
          {openDropdown === "assign" && (
            <div className="absolute bottom-full left-0 mb-2 w-48 max-h-60 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted transition-colors text-muted-foreground italic"
                onClick={() =>
                  handleBulkUpdate({ assignedToId: null }, "unassigned")
                }
              >
                Unassign
              </button>
              {technicians.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted transition-colors"
                  onClick={() =>
                    handleBulkUpdate(
                      { assignedToId: tech.id },
                      `assigned to ${tech.name}`
                    )
                  }
                >
                  {tech.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isPending && (
          <div className="pl-2">
            <Loader2 className="h-4 w-4 animate-spin text-background/60" />
          </div>
        )}

        {/* Clear selection */}
        <div className="pl-2 border-l border-background/20">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-background/60 hover:text-background hover:bg-background/10"
            onClick={onClear}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

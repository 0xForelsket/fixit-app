"use client";

import {
  addWorkOrderComment,
  duplicateWorkOrder,
  resolveWorkOrder,
  updateWorkOrder,
} from "@/actions/workOrders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User, WorkOrder } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Copy,
  MessageSquare,
  Send,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

interface WorkOrderActionsProps {
  workOrder: WorkOrder;
  currentUser: { id: number; name: string };
  allTechs: User[];
}

export function WorkOrderActions({
  workOrder,
  currentUser,
  allTechs: _allTechs,
}: WorkOrderActionsProps) {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Status/Assign actions
  const [_assignState, assignAction, isAssignPending] = useActionState(
    updateWorkOrder.bind(null, workOrder.id),
    undefined
  );

  // Resolve action
  const [_resolveState, resolveAction, isResolvePending] = useActionState(
    resolveWorkOrder.bind(null, workOrder.id),
    undefined
  );

  // Comment action
  const [_commentState, commentAction, isCommentPending] = useActionState(
    addWorkOrderComment.bind(null, workOrder.id),
    undefined
  );

  const isAssignedToMe = workOrder.assignedToId === currentUser.id;

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateWorkOrder(workOrder.id);
      if (result.success && result.data) {
        router.push(`/maintenance/work-orders/${result.data.id}`);
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="space-y-2 print:hidden">
      {/* Quick Action Buttons - Compact Style */}
      <div className="flex flex-col gap-2">
        {/* Assign to Me Button */}
        {!isAssignedToMe && workOrder.status !== "resolved" && (
          <form action={assignAction}>
            <input type="hidden" name="assignedToId" value={currentUser.id} />
            <ActionButton
              icon={UserIcon}
              label="Assign to Me"
              variant="outline"
              disabled={isAssignPending}
              type="submit"
            />
          </form>
        )}

        {/* Resolve Button */}
        {workOrder.status !== "resolved" && (
          <ActionButton
            icon={CheckCircle2}
            label={isResolving ? "Cancel" : "Resolve"}
            variant={isResolving ? "outline" : "primary"}
            onClick={() => setIsResolving(!isResolving)}
          />
        )}

        {/* Resolution Form */}
        {isResolving && (
          <form
            action={resolveAction}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="resolutionNotes"
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
              >
                Resolution Notes
              </Label>
              <textarea
                name="resolutionNotes"
                id="resolutionNotes"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-success-500 focus:border-success-500 min-h-[60px] transition-all"
                placeholder="What was done?"
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full bg-success-600 hover:bg-success-700 text-white font-bold rounded-lg h-8 text-xs"
              disabled={isResolvePending}
            >
              Confirm
            </Button>
          </form>
        )}

        {/* Duplicate Button */}
        <ActionButton
          icon={Copy}
          label={isDuplicating ? "Duplicating..." : "Duplicate"}
          variant="outline"
          onClick={handleDuplicate}
          disabled={isDuplicating}
        />

        {/* Add Comment Button */}
        <ActionButton
          icon={MessageSquare}
          label={showCommentForm ? "Cancel" : "Comment"}
          variant="outline"
          onClick={() => setShowCommentForm(!showCommentForm)}
        />

        {/* Comment Form */}
        {showCommentForm && (
          <form
            action={commentAction}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200"
          >
            <textarea
              name="comment"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm min-h-[60px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Type your comment..."
              required
            />
            <Button
              type="submit"
              size="sm"
              className="w-full font-bold rounded-lg h-8 text-xs"
              disabled={isCommentPending}
            >
              <Send className="mr-1.5 h-3 w-3" />
              Post
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Compact Action Button - matches equipment page QuickActionButton style
function ActionButton({
  icon: Icon,
  label,
  variant,
  onClick,
  disabled,
  type = "button",
}: {
  icon: React.ElementType;
  label: string;
  variant: "primary" | "outline" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-success-600 border-success-700 text-white hover:bg-success-700 shadow-sm",
    outline: "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300",
    danger: "bg-danger-600 border-danger-700 text-white hover:bg-danger-700 shadow-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all active:scale-95 font-bold text-xs w-full disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="uppercase tracking-wider">{label}</span>
    </button>
  );
}

"use client";

import {
  addWorkOrderComment,
  duplicateWorkOrder,
  resolveWorkOrder,
  updateWorkOrder,
} from "@/actions/workOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6 print:hidden">
      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Assign to Me Button */}
          {!isAssignedToMe && workOrder.status !== "resolved" && (
            <form action={assignAction}>
              <input type="hidden" name="assignedToId" value={currentUser.id} />
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={isAssignPending}
              >
                <UserIcon className="h-4 w-4" />
                Assign to Me
              </Button>
            </form>
          )}

          {/* Resolve Button */}
          {workOrder.status !== "resolved" && (
            <Button
              variant={isResolving ? "secondary" : "default"}
              className={cn(
                "w-full justify-start gap-2",
                !isResolving && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => setIsResolving(!isResolving)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isResolving ? "Cancel Resolution" : "Resolve Work Order"}
            </Button>
          )}

          {/* Resolution Form */}
          {isResolving && (
            <form
              action={resolveAction}
              className="rounded-lg border bg-muted/50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="resolutionNotes"
                  className="text-xs font-semibold"
                >
                  Resolution Notes
                </Label>
                <textarea
                  name="resolutionNotes"
                  id="resolutionNotes"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  placeholder="What was done to fix the issue?"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isResolvePending}
              >
                Confirm Resolution
              </Button>
            </form>
          )}

          {/* Duplicate Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="h-4 w-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate Work Order"}
          </Button>
        </CardContent>
      </Card>

      {/* Add Comment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Add Comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={commentAction} className="space-y-3">
            <textarea
              name="comment"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] focus:ring-2 focus:ring-primary-500"
              placeholder="Type your comment here..."
              required
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isCommentPending}>
                <Send className="mr-2 h-4 w-4" />
                Post Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

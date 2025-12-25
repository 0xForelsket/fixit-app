"use client";

import {
  addTicketComment,
  resolveTicket,
  updateTicket,
} from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Ticket, User } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  MessageSquare,
  Send,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

interface TicketActionsProps {
  ticket: Ticket;
  currentUser: { id: number; name: string };
  allTechs: User[];
}

export function TicketActions({
  ticket,
  currentUser,
  allTechs,
}: TicketActionsProps) {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);

  // Status/Assign actions
  const [assignState, assignAction, isAssignPending] = useActionState(
    updateTicket.bind(null, ticket.id),
    {}
  );

  // Resolve action
  const [resolveState, resolveAction, isResolvePending] = useActionState(
    resolveTicket.bind(null, ticket.id),
    {}
  );

  // Comment action
  const [commentState, commentAction, isCommentPending] = useActionState(
    addTicketComment.bind(null, ticket.id),
    {}
  );

  const isAssignedToMe = ticket.assignedToId === currentUser.id;

  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Assign to Me Button */}
          {!isAssignedToMe && ticket.status !== "resolved" && (
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
          {ticket.status !== "resolved" && (
            <Button
              variant={isResolving ? "secondary" : "default"}
              className={cn(
                "w-full justify-start gap-2",
                !isResolving && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => setIsResolving(!isResolving)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isResolving ? "Cancel Resolution" : "Resolve Ticket"}
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

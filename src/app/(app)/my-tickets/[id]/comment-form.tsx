"use client";

import { addWorkOrderComment } from "@/actions/workOrders";
import { Button } from "@/components/ui/button";
import { useActionState, useRef } from "react";

interface CommentFormProps {
  workOrderId: string;
}

export function CommentForm({ workOrderId }: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = addWorkOrderComment.bind(null, workOrderId);
  const [state, formAction, isPending] = useActionState(boundAction, undefined);

  // Clear form on success
  if (state?.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3">
      {state && !state.success && state.error && (
        <p className="text-sm text-danger-600">{state.error}</p>
      )}
      <textarea
        name="comment"
        placeholder="Add a comment or update..."
        rows={2}
        required
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Add Comment"}
      </Button>
    </form>
  );
}

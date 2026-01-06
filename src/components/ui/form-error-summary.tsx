"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";
import * as React from "react";
import type { FieldErrors } from "react-hook-form";

interface FormErrorSummaryProps {
  /** General error message (e.g., from server action) */
  error?: string;
  /** Field-level errors from server action */
  fieldErrors?: Record<string, string[]>;
  /** Field errors from React Hook Form */
  formErrors?: FieldErrors;
  /** Additional CSS classes */
  className?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

/**
 * Displays a summary of form errors at the top of a form.
 * Supports both server-side ActionResult errors and React Hook Form errors.
 */
export function FormErrorSummary({
  error,
  fieldErrors,
  formErrors,
  className,
  onDismiss,
}: FormErrorSummaryProps) {
  const [dismissed, setDismissed] = React.useState(false);

  // Create a stable key from errors to track changes
  const errorKey = JSON.stringify({ error, fieldErrors, formErrors });

  // Reset dismissed state when errors change
  // biome-ignore lint/correctness/useExhaustiveDependencies: errorKey tracks error changes intentionally
  React.useEffect(() => {
    setDismissed(false);
  }, [errorKey]);

  // Collect all errors
  const allErrors: { field?: string; message: string }[] = [];

  // Add general error
  if (error) {
    allErrors.push({ message: error });
  }

  // Add field errors from server action
  if (fieldErrors) {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      for (const message of messages) {
        allErrors.push({ field, message });
      }
    }
  }

  // Add field errors from React Hook Form
  if (formErrors) {
    for (const [field, errorObj] of Object.entries(formErrors)) {
      if (errorObj?.message && typeof errorObj.message === "string") {
        allErrors.push({ field, message: errorObj.message });
      }
    }
  }

  // Don't render if no errors or dismissed
  if (allErrors.length === 0 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/50 bg-destructive/10 p-4 animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-destructive">
            {allErrors.length === 1
              ? "There was a problem with your submission"
              : `There were ${allErrors.length} problems with your submission`}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-destructive/90">
            {allErrors.map((err, idx) => (
              <li key={`error-${err.field || "general"}-${idx}`}>
                {err.field ? (
                  <>
                    <span className="font-medium capitalize">
                      {err.field.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    : {err.message}
                  </>
                ) : (
                  err.message
                )}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="text-destructive/70 hover:text-destructive transition-colors"
            aria-label="Dismiss errors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

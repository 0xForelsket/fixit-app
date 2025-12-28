"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Auth route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-50">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-danger-50 border-2 border-danger-200 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-danger-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900">
            Authentication Error
          </h1>
          <p className="text-sm text-zinc-600">
            There was a problem with the login system. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <Button onClick={reset} className="w-full gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

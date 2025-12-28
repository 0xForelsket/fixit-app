"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Main route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-danger-50 border-2 border-danger-200 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-danger-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-zinc-600">
            An error occurred while loading this page. Please try again or
            return to the dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/dashboard" className="gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 bg-slate-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-100">
        <AlertTriangle className="h-10 w-10 text-danger-600" />
      </div>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-center max-w-md">
        An unexpected error occurred. Please try again or return to the home
        page.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mt-4">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}

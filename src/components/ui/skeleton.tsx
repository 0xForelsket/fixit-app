"use client";

import { cn } from "@/lib/utils";
import type * as React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-none",
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton compositions
function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 animate-in">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonTicketList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`ticket-skeleton-${i}`}
          className={cn(
            "flex items-center gap-4 rounded-xl border bg-card p-4",
            `animate-stagger-${Math.min(i + 1, 5)} animate-in`
          )}
        >
          <div className="w-1.5 h-12 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`stats-skeleton-${i}`}
          className={cn(
            "flex items-center gap-4 rounded-xl border bg-card p-5",
            `animate-stagger-${i + 1} animate-in`
          )}
        >
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  cols = 4,
}: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`table-header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`table-row-${rowIdx}`} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={`table-cell-${rowIdx}-${colIdx}`}
                className="h-4 flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTicketList,
  SkeletonStatsGrid,
  SkeletonTable,
};

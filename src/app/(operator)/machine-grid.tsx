"use client";

import { Badge } from "@/components/ui/badge";
import type { Location, Machine } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Factory,
  MapPin,
  Wrench,
} from "lucide-react";
import Link from "next/link";

interface MachineWithLocation extends Machine {
  location: Location | null;
}

interface MachineGridProps {
  machines: MachineWithLocation[];
}

export function MachineGrid({ machines }: MachineGridProps) {
  if (machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-lg border-2 border-dashed">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Factory className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">
          No machines found
        </h3>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          We couldn't find any machines matching your search. Try adjusting the
          filters or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {machines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
}

function MachineCard({ machine }: { machine: MachineWithLocation }) {
  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      headerBg: "bg-emerald-100",
      headerBorder: "border-emerald-200",
      text: "text-emerald-900",
      iconColor: "text-emerald-600",
      label: "Operational",
    },
    down: {
      icon: AlertTriangle,
      headerBg: "bg-rose-100",
      headerBorder: "border-rose-200",
      text: "text-rose-900",
      iconColor: "text-rose-600",
      label: "Line Down",
    },
    maintenance: {
      icon: Wrench,
      headerBg: "bg-amber-100",
      headerBorder: "border-amber-200",
      text: "text-amber-900",
      iconColor: "text-amber-600",
      label: "Maintenance",
    },
  } as const;

  const config = statusConfig[machine.status];
  const StatusIcon = config.icon;

  return (
    <Link
      href={`/report/${machine.code}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary-300"
    >
      {/* Color-Blocked Header */}
      <div
        className={cn(
          "flex items-start justify-between px-5 py-4 border-b",
          config.headerBg,
          config.headerBorder
        )}
      >
        <div className="space-y-1">
          <h3 className={cn("font-bold text-lg leading-tight", config.text)}>
            {machine.name}
          </h3>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wider opacity-80",
              config.text
            )}
          >
            {config.label}
          </p>
        </div>
        <StatusIcon className={cn("h-6 w-6 shrink-0", config.iconColor)} />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          {/* Code */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Code
            </span>
            <span className="font-mono text-sm font-medium bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
              {machine.code}
            </span>
          </div>

          {/* Location */}
          {machine.location && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Loc
              </span>
              <div className="flex items-center gap-1 text-sm text-foreground/80">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {machine.location.name}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <span className="text-sm font-medium text-primary-600 group-hover:underline decoration-2 underline-offset-4">
            Report Issue
          </span>
          <div className="rounded-full bg-primary-50 p-2 text-primary-600 transition-colors group-hover:bg-primary-100">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}



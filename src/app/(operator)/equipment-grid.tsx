"use client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Equipment, Location } from "@/db/schema";
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

interface EquipmentWithLocation extends Equipment {
  location: Location | null;
}

interface EquipmentGridProps {
  equipment: EquipmentWithLocation[];
}

export function EquipmentGrid({ equipment }: EquipmentGridProps) {
  if (equipment.length === 0) {
    return (
      <EmptyState
        title="No equipment found"
        description="We couldn't find any equipment matching your current filters or search term."
        icon={Factory}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {equipment.map((item, index) => (
        <EquipmentCard key={item.id} equipment={item} index={index} />
      ))}
    </div>
  );
}

function EquipmentCard({
  equipment,
  index,
}: {
  equipment: EquipmentWithLocation;
  index: number;
}) {
  const staggerClass =
    index < 8
      ? `animate-stagger-${index + 1}`
      : "animate-in fade-in duration-500";
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

  const config = statusConfig[equipment.status];
  const StatusIcon = config.icon;

  return (
    <Link
      href={`/equipment/${equipment.code}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all hover:shadow-md hover:border-primary-300 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-1",
        staggerClass
      )}
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
            {equipment.name}
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
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Code
            </span>
            <span className="font-mono text-sm font-bold bg-zinc-100 px-2 py-0.5 rounded-lg text-zinc-700">
              {equipment.code}
            </span>
          </div>

          {/* Location */}
          {equipment.location && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Loc
              </span>
              <div className="flex items-center gap-1 text-sm text-zinc-600">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                {equipment.location.name}
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

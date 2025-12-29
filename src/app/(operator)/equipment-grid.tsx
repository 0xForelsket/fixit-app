"use client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Equipment, Location } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Factory,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

interface EquipmentWithLocation extends Equipment {
  location: Location | null;
}

interface EquipmentGridProps {
  equipment: EquipmentWithLocation[];
  hash?: string;
}

export function EquipmentGrid({ equipment, hash }: EquipmentGridProps) {
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
    <div className="flex flex-col gap-2 pb-2">
      {equipment.map((item, index) => (
        <EquipmentCard key={item.id} equipment={item} index={index} hash={hash} />
      ))}
    </div>
  );
}

function EquipmentCard({
  equipment,
  index,
  hash,
}: {
  equipment: EquipmentWithLocation;
  index: number;
  hash?: string;
}) {
  const staggerClass =
    index < 20
      ? `animate-in animate-stagger-${Math.min(index + 1, 20)}`
      : "animate-in fade-in duration-500";

  const href = `/equipment/${equipment.code}${hash ? `#${hash}` : ""}`;

  return (
    <Link
      href={href}
      title={`View details for ${equipment.name}`}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md active:scale-[0.98] cursor-pointer",
        staggerClass
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-900 leading-none truncate">
            {equipment.name}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-600">
            {equipment.code}
          </span>
        </div>
        
        {equipment.location && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{equipment.location.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={equipment.status} />
        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
      </div>
    </Link>
  );
}


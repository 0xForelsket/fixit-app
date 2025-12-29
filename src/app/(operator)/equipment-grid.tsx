"use client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Equipment, Location } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Factory,
  MapPin,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

import { saveToRecent } from "@/components/home/recent-equipment";

interface EquipmentWithLocation extends Equipment {
  location: Location | null;
  children?: { id: number }[];
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
      onClick={() => {
        saveToRecent({
          id: equipment.id,
          name: equipment.name,
          code: equipment.code,
          locationName: equipment.location?.name,
        });
      }}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] cursor-pointer",
        staggerClass
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-sm text-zinc-900 leading-tight truncate">
            {equipment.name}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-mono font-bold text-zinc-500 uppercase">
            {equipment.code}
          </span>
          {equipment.parentId && (
            <span className="inline-flex shrink-0 items-center rounded bg-zinc-50 border border-zinc-200 px-1 py-0.5 text-[8px] font-black text-zinc-400 uppercase tracking-tighter">
              Sub-asset
            </span>
          )}
          {equipment.children && equipment.children.length > 0 && (
            <Layers className="h-3 w-3 text-primary-500/50" />
          )}
        </div>
        
        {equipment.location && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <MapPin className="h-2.5 w-2.5 shrink-0 opacity-70" />
            <span className="truncate">{equipment.location.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={equipment.status} className="scale-90 origin-right" />
        <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
      </div>
    </Link>
  );
}


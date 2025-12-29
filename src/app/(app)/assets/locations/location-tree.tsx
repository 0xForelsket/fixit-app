"use client";

import { 
  Plus, 
  Settings,
  MapPin,
  Building
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TreeExplorer } from "@/components/ui/tree-explorer";
import type { BaseTreeItem } from "@/components/ui/tree-explorer";

interface Location extends BaseTreeItem {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  description: string | null;
}

interface LocationTreeProps {
  initialLocations: Location[];
}

export function LocationTree({ initialLocations }: LocationTreeProps) {
  return (
    <TreeExplorer
      items={initialLocations}
      renderIcon={(_item, hasChildren) => (
        hasChildren ? <Building className="h-5 w-5" /> : <MapPin className="h-5 w-5" />
      )}
      renderTitle={(item) => (
        <div className="flex items-center gap-3">
          <span>{item.name}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-1 font-mono text-[10px] font-bold text-zinc-500 uppercase">
            {item.code}
          </span>
        </div>
      )}
      renderSubtitle={(item) => item.description || "No description"}
      renderBadges={(item) => (
        item.isActive ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 scale-75 origin-right">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-700 scale-75 origin-right">
            Inactive
          </span>
        )
      )}
      renderActions={(item) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild title="Add Sub-location">
            <Link href={`/assets/locations/new?parentId=${item.id}`}>
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary-600 hover:text-primary-700" asChild title="View Details / Edit">
            <Link href={`/assets/locations/${item.id}`}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </>
      )}
      getSearchTerms={(item) => [item.name, item.code, item.description || ""]}
      emptyMessage="No locations found in the registry."
      className="h-[calc(100vh-250px)]"
    />
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TreeExplorer } from "@/components/ui/tree-explorer";
import type { BaseTreeItem } from "@/components/ui/tree-explorer";
import { ExternalLink, Layers, MonitorCog, Plus, Settings } from "lucide-react";
import Link from "next/link";

interface Equipment extends BaseTreeItem {
  id: string;
  name: string;
  code: string;
  status: string;
  locationId: string;
  location?: { name: string } | null;
}

interface AssetTreeProps {
  initialEquipment: Equipment[];
}

export function AssetTree({ initialEquipment }: AssetTreeProps) {
  return (
    <TreeExplorer
      items={initialEquipment}
      renderIcon={(_item, hasChildren) =>
        hasChildren ? (
          <Layers className="h-5 w-5" />
        ) : (
          <MonitorCog className="h-5 w-5" />
        )
      }
      renderTitle={(item) => (
        <div className="flex items-center gap-3">
          <span>{item.name}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-1 font-mono text-[10px] font-bold text-zinc-500 uppercase">
            {item.code}
          </span>
        </div>
      )}
      renderSubtitle={(item) => item.location?.name || "No Location"}
      renderBadges={(item) => (
        <StatusBadge status={item.status} className="scale-75 origin-right" />
      )}
      renderActions={(item) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            asChild
            title="Add Sub-asset"
          >
            <Link
              href={`/assets/equipment/new?parentId=${item.id}&locationId=${item.locationId}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            asChild
            title="Edit Asset"
          >
            <Link href={`/assets/equipment/${item.code}/edit`}>
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-primary-600 hover:text-primary-700"
            asChild
            title="View Details"
          >
            <Link href={`/assets/equipment/${item.code}`}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </>
      )}
      getSearchTerms={(item) => [
        item.name,
        item.code,
        item.location?.name || "",
      ]}
      emptyMessage="No equipment found in the system."
      className="h-[calc(100vh-250px)]"
    />
  );
}

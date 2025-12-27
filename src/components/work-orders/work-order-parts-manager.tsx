"use client";

import { Package } from "lucide-react";
import { AddPartDialog } from "./parts/add-part-dialog";
import { PartsList } from "./parts/parts-list";
import { PartsSummary } from "./parts/parts-summary";

interface Part {
  id: number;
  name: string;
  sku: string;
}

interface Location {
  id: number;
  name: string;
}

interface WorkOrderPart {
  id: number;
  part: Part;
  quantity: number;
  unitCost: number | null;
  addedBy: { name: string };
  addedAt: Date;
}

interface WorkOrderPartsManagerProps {
  workOrderId: number;
  parts: WorkOrderPart[]; // Consumed parts
  allParts: Part[]; // Catalog
  locations: Location[];
}

export function WorkOrderPartsManager({
  workOrderId,
  parts,
  allParts,
  locations,
}: WorkOrderPartsManagerProps) {
  return (
    <div className="rounded-2xl border-2 bg-white overflow-hidden shadow-sm">
      <div className="bg-zinc-50 px-4 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-zinc-400" />
          <h3 className="font-black text-xs uppercase tracking-widest text-zinc-900">
            Parts & Materials
          </h3>
        </div>
        <AddPartDialog
          workOrderId={workOrderId}
          allParts={allParts}
          locations={locations}
        />
      </div>

      <div className="p-4 space-y-4">
        <PartsList parts={parts} />
        <PartsSummary parts={parts} />
      </div>
    </div>
  );
}

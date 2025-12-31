import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-zinc-400" />
          <CardTitle className="font-black text-xs uppercase tracking-widest text-zinc-900">
            Parts & Materials
          </CardTitle>
        </div>
        <AddPartDialog
          workOrderId={workOrderId}
          allParts={allParts}
          locations={locations}
        />
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <PartsList parts={parts} />
        <PartsSummary parts={parts} />
      </CardContent>
    </Card>
  );
}

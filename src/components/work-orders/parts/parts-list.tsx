import { Package } from "lucide-react";

interface Part {
  id: string;
  name: string;
  sku: string;
}

interface WorkOrderPart {
  id: string;
  part: Part;
  quantity: number;
  unitCost: number | null;
  addedBy: { name: string };
  addedAt: Date;
}

interface PartsListProps {
  parts: WorkOrderPart[];
}

export function PartsList({ parts }: PartsListProps) {
  if (parts.length === 0) {
    return (
      <div className="py-8 text-center bg-zinc-50 rounded-xl border-2 border-dashed">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          No parts registered
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parts.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-xl border-2 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-zinc-50 border-2 flex items-center justify-center text-zinc-400 shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-zinc-900 truncate uppercase mt-0.5">
                {p.part.name}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                  {p.quantity} UNITS
                </span>
                {p.unitCost && <span>• ${p.unitCost.toFixed(2)} ea</span>}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-sm text-zinc-900 leading-none">
              $
              {((p.unitCost || 0) * p.quantity).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
              By {p.addedBy.name.split(" ")[0]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

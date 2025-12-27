interface WorkOrderPart {
  quantity: number;
  unitCost: number | null;
}

interface PartsSummaryProps {
  parts: WorkOrderPart[];
}

export function PartsSummary({ parts }: PartsSummaryProps) {
  if (parts.length === 0) return null;

  const totalCost = parts.reduce(
    (sum, p) => sum + (p.unitCost || 0) * p.quantity,
    0
  );

  return (
    <div className="pt-4 mt-2 border-t-2 border-zinc-100 flex justify-between items-center">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
        Total Materials
      </span>
      <span className="text-lg font-black text-zinc-900">
        ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}

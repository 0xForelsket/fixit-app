import { cn, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, Clock, Wrench } from "lucide-react";
import Link from "next/link";

interface WorkOrderHistoryItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

interface EquipmentHistoryProps {
  workOrders: WorkOrderHistoryItem[];
}

export function EquipmentHistory({ workOrders }: EquipmentHistoryProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border-2 border-zinc-200">
          <Wrench className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-lg font-black text-zinc-900">No History</h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-xs">
          No work orders have been created for this equipment yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workOrders.map((wo) => (
        <Link
          key={wo.id}
          href={`/my-tickets/${wo.id}`}
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:border-primary-300 hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-black text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                #{wo.id}
              </span>
              <h4 className="font-bold text-sm text-zinc-900 truncate">
                {wo.title}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-400">
              <div className="flex items-center gap-1 uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(wo.createdAt)}
              </div>
              <StatusBadge status={wo.status} />
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-zinc-300 shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; color: string }
  > = {
    open: { label: "Open", color: "text-blue-600 bg-blue-50 border-blue-100" },
    in_progress: { label: "In Progress", color: "text-amber-600 bg-amber-50 border-amber-100" },
    resolved: { label: "Resolved", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    closed: { label: "Closed", color: "text-zinc-600 bg-zinc-50 border-zinc-200" },
  };

  const { label, color } = config[status] || config.open;
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", color)}>
      {label}
    </span>
  );
}

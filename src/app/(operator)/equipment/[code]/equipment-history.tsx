import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
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
    <div className="space-y-3">
      {workOrders.map((wo) => (
        <Link
          key={wo.id}
          href={`/my-tickets/${wo.id}`}
          className="flex items-center gap-4 rounded-2xl border-2 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-lg">
                #{wo.id}
              </span>
              <span className="font-bold text-zinc-900 line-clamp-1">
                {wo.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeTime(wo.createdAt)}</span>
              <StatusBadge status={wo.status} />
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-300" />
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "warning" | "success" | "secondary" }> = {
    open: { label: "Open", variant: "default" },
    in_progress: { label: "In Progress", variant: "warning" },
    resolved: { label: "Resolved", variant: "success" },
    closed: { label: "Closed", variant: "secondary" },
  };

  const { label, variant } = config[status] || config.open;
  return <Badge variant={variant}>{label}</Badge>;
}

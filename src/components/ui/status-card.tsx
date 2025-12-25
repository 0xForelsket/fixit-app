import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
  Wrench,
} from "lucide-react";

interface StatusCardProps {
  label: string;
  count: number;
  status: "operational" | "down" | "maintenance";
}

const statusConfig: Record<
  StatusCardProps["status"],
  { color: string; bg: string; border: string; icon: LucideIcon }
> = {
  operational: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  down: {
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: AlertTriangle,
  },
  maintenance: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Wrench,
  },
};

export function StatusCard({ label, count, status }: StatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-2 bg-white shadow-sm transition-all",
        config.border
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={cn("text-lg font-bold leading-none", config.color)}>
          {count}
        </p>
      </div>
    </div>
  );
}

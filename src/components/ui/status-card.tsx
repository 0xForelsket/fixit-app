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
  { labelColor: string; iconColor: string; bg: string; dotClass: string; icon: LucideIcon }
> = {
  operational: {
    labelColor: "text-success-700",
    iconColor: "text-success-500",
    bg: "bg-success-50",
    dotClass: "status-operational",
    icon: CheckCircle2,
  },
  down: {
    labelColor: "text-danger-700",
    iconColor: "text-danger-500",
    bg: "bg-danger-50",
    dotClass: "status-down",
    icon: AlertTriangle,
  },
  maintenance: {
    labelColor: "text-warning-700",
    iconColor: "text-warning-500",
    bg: "bg-warning-50",
    dotClass: "status-maintenance",
    icon: Wrench,
  },
};

export function StatusCard({ label, count, status }: StatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex min-w-[120px] items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover-lift"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg relative overflow-hidden",
          config.bg
        )}
      >
        <Icon className={cn("h-5 w-5 z-10", config.iconColor)} />
        <div className={cn("absolute inset-0 opacity-10", config.dotClass)} />
      </div>
      <div className="flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </p>
        <p className={cn("text-xl font-mono font-bold leading-none mt-0.5", config.labelColor)}>
          {count}
        </p>
      </div>
    </div>
  );
}

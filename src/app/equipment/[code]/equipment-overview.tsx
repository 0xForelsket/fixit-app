"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";

interface EquipmentOverviewProps {
  equipment: {
    id: number;
    name: string;
    code: string;
    status: "operational" | "down" | "maintenance";
  };
  hasDuePM: boolean;
  openWorkOrderCount: number;
}

export function EquipmentOverview({
  equipment,
  hasDuePM,
  openWorkOrderCount,
}: EquipmentOverviewProps) {
  return (
    <div className="space-y-4">
      {/* PM Alert - Compact */}
      {hasDuePM && (
        <div className="rounded-xl border border-warning-200 bg-amber-50/50 p-3 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-warning-200 text-warning-600 shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 leading-none">Maintenance Due</p>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">
                Scheduled attention required
              </p>
            </div>
          </div>
          <Button
            size="sm"
            asChild
            className="bg-warning-600 hover:bg-warning-700 h-8 rounded-lg font-bold shadow-sm"
          >
            <Link href="#maintenance">Start</Link>
          </Button>
        </div>
      )}

      {/* Quick Actions - Toolbar Style */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Quick Actions
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <QuickActionButton
            icon={AlertTriangle}
            label="Report Issue"
            variant="danger"
            href="#report"
          />
          <QuickActionButton
            icon={ClipboardCheck}
            label="Complete PM"
            variant="primary"
            href="#maintenance"
            disabled={!hasDuePM}
          />
        </div>
      </div>

      {/* Status Summary */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Current Status
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <StatusCondensedCard
            label="Status"
            value={equipment.status}
            icon={equipment.status === "operational" ? CheckCircle2 : Wrench}
            variant={equipment.status === "operational" ? "success" : "warning"}
          />
          <StatusCondensedCard
            label="Open Tickets"
            value={openWorkOrderCount.toString()}
            icon={AlertTriangle}
            variant={openWorkOrderCount > 0 ? "warning" : "success"}
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  variant,
  href,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  variant: "danger" | "primary";
  href: string;
  disabled?: boolean;
}) {
  const styles = {
    danger: "bg-danger-600 border-danger-700 text-white hover:bg-danger-700",
    primary: "bg-zinc-900 border-zinc-950 text-white hover:bg-black",
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-2 opacity-50 cursor-not-allowed whitespace-nowrap">
        <Icon className="h-4 w-4 text-zinc-400" />
        <span className="text-xs font-bold text-zinc-400">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all active:scale-95 whitespace-nowrap font-bold shadow-sm",
        styles[variant]
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function StatusCondensedCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: "success" | "warning" | "danger";
}) {
  const textStyles = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  };
  
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm border-l-4 border-l-current overflow-hidden" style={{ color: variant === 'success' ? '#10b981' : variant === 'warning' ? '#f59e0b' : '#ef4444' }}>
      <div className="flex items-center gap-1.5 mb-1 text-zinc-400">
        <Icon className={cn("h-3 w-3", textStyles[variant])} />
        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-sm font-black capitalize text-zinc-900 truncate">
        {value.replace("_", " ")}
      </p>
    </div>
  );
}

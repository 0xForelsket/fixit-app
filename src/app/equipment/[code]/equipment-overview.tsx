"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
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
    parent?: {
      id: number;
      name: string;
      code: string;
    } | null;
    children?: {
      id: number;
      name: string;
      code: string;
      status: "operational" | "down" | "maintenance";
    }[] | null;
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
    <div className="space-y-6">
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

      {/* Hierarchy Section */}
      {(equipment.parent || (equipment.children && equipment.children.length > 0)) && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Asset Hierarchy
          </h3>
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            {/* Parent Asset */}
            {equipment.parent && (
              <div className="p-3 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 text-zinc-500">
                    <Wrench className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Parent Asset</p>
                    <p className="text-xs font-bold text-zinc-900 truncate tracking-tight">{equipment.parent.name}</p>
                  </div>
                </div>
                <Link href={`/equipment/${equipment.parent.code}`} className="text-[10px] font-black text-primary-600 hover:text-primary-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  VIEW PARENT
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Sub-assets */}
            {equipment.children && equipment.children.length > 0 && (
              <div className="divide-y divide-zinc-50">
                {equipment.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/equipment/${child.code}`}
                    className="flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        child.status === 'operational' ? 'bg-emerald-500' : 'bg-rose-500'
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate leading-none mb-1">{child.name}</p>
                        <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">{child.code}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-200 group-hover:text-zinc-400 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
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

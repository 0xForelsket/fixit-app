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
    <div className="space-y-6">
      {/* PM Alert */}
      {hasDuePM && (
        <div className="rounded-xl border border-warning-200 bg-white border-l-4 border-l-warning-500 p-4 flex items-center gap-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-50">
            <Calendar className="h-6 w-6 text-warning-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-zinc-900">Maintenance Due</p>
            <p className="text-sm text-zinc-500">
              This equipment has scheduled maintenance that needs attention.
            </p>
          </div>
          <Button
            asChild
            className="bg-warning-600 hover:bg-warning-700 rounded-lg font-bold shadow-sm"
          >
            <Link href="#maintenance">Start PM</Link>
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={AlertTriangle}
            label="Report Issue"
            description="Something wrong?"
            variant="danger"
            href="#report"
          />
          <QuickActionCard
            icon={ClipboardCheck}
            label="Complete PM"
            description="Run checklist"
            variant="warning"
            href="#maintenance"
            disabled={!hasDuePM}
          />
        </div>
      </div>

      {/* Status Summary */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Current Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            label="Equipment Status"
            value={equipment.status}
            icon={equipment.status === "operational" ? CheckCircle2 : Wrench}
            variant={equipment.status === "operational" ? "success" : "warning"}
          />
          <StatusCard
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

function QuickActionCard({
  icon: Icon,
  label,
  description,
  variant,
  href,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  variant: "danger" | "warning" | "primary";
  href: string;
  disabled?: boolean;
}) {
  const variantStyles = {
    danger: "bg-white border-danger-200 hover:bg-danger-50/50 hover:border-danger-300",
    warning: "bg-white border-warning-200 hover:bg-warning-50/50 hover:border-warning-300",
    primary: "bg-white border-primary-200 hover:bg-primary-50/50 hover:border-primary-300",
  };

  const iconStyles = {
    danger: "text-danger-600",
    warning: "text-warning-600",
    primary: "text-primary-600",
  };

  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-4 text-center bg-zinc-50/50 opacity-60 cursor-not-allowed">
        <Icon className="h-8 w-8 mb-2 text-zinc-400" />
        <span className="font-bold text-zinc-700">{label}</span>
        <span className="text-xs text-zinc-500">{description}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        variantStyles[variant]
      )}
    >
      <Icon className={cn("h-8 w-8 mb-2", iconStyles[variant])} />
      <span className="font-bold text-zinc-900">{label}</span>
      <span className="text-xs text-zinc-500">{description}</span>
    </Link>
  );
}

function StatusCard({
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
  const variantStyles = {
    success: "border-zinc-200 bg-white",
    warning: "border-zinc-200 bg-white",
    danger: "border-zinc-200 bg-white",
  };

  const textStyles = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700",
  };
  
  // Use left border accent for status cards
  const accentBorder = {
    success: "border-l-4 border-l-emerald-500",
    warning: "border-l-4 border-l-amber-500",
    danger: "border-l-4 border-l-rose-500",
  };

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", variantStyles[variant], accentBorder[variant])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", textStyles[variant])} />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {label}
        </span>
      </div>
      <p className={cn("text-lg font-black capitalize text-zinc-900")}>
        {value.replace("_", " ")}
      </p>
    </div>
  );
}

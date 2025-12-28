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
        <div className="rounded-2xl border-2 border-warning-300 bg-warning-50 p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100">
            <Calendar className="h-6 w-6 text-warning-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-warning-800">Maintenance Due</p>
            <p className="text-sm text-warning-700">
              This equipment has scheduled maintenance that needs attention.
            </p>
          </div>
          <Button
            asChild
            className="bg-warning-600 hover:bg-warning-700 rounded-xl font-bold"
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
    danger: "border-danger-200 bg-danger-50 hover:bg-danger-100",
    warning: "border-warning-200 bg-warning-50 hover:bg-warning-100",
    primary: "border-primary-200 bg-primary-50 hover:bg-primary-100",
  };

  const iconStyles = {
    danger: "text-danger-600",
    warning: "text-warning-600",
    primary: "text-primary-600",
  };

  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-200">
        <Icon className="h-8 w-8 mb-2 text-zinc-400" />
        <span className="font-bold text-zinc-900">{label}</span>
        <span className="text-xs text-zinc-500">{description}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.98]",
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
    success: "border-success-200 bg-success-50",
    warning: "border-warning-200 bg-warning-50",
    danger: "border-danger-200 bg-danger-50",
  };

  const textStyles = {
    success: "text-success-700",
    warning: "text-warning-700",
    danger: "text-danger-700",
  };

  return (
    <div className={cn("rounded-2xl border-2 p-4", variantStyles[variant])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", textStyles[variant])} />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {label}
        </span>
      </div>
      <p className={cn("text-lg font-black capitalize", textStyles[variant])}>
        {value.replace("_", " ")}
      </p>
    </div>
  );
}

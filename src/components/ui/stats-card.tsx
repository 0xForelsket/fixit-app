import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";
  description?: string;
  href?: string;
  active?: boolean;
  className?: string;
  trend?: {
    value: number;
    positive: boolean;
    label?: string;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  description,
  href,
  active = false,
  className,
  trend,
}: StatsCardProps) {
  const styles = {
    default: {
      border: "border-zinc-200",
      bg: "bg-white",
      iconBg: "bg-zinc-100",
      iconColor: "text-zinc-600",
      textColor: "text-zinc-900",
    },
    primary: {
      border: "border-primary-200",
      bg: "bg-primary-50/50",
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      textColor: "text-primary-900",
    },
    secondary: {
      border: "border-zinc-200",
      bg: "bg-zinc-50/50",
      iconBg: "bg-white",
      iconColor: "text-zinc-500",
      textColor: "text-zinc-700",
    },
    success: {
      border: "border-success-200",
      bg: "bg-success-50/50",
      iconBg: "bg-success-100",
      iconColor: "text-success-600",
      textColor: "text-success-700",
    },
    warning: {
      border: "border-warning-200",
      bg: "bg-warning-50/50",
      iconBg: "bg-warning-100",
      iconColor: "text-warning-600",
      textColor: "text-warning-700",
    },
    danger: {
      border: "border-danger-200",
      bg: "bg-danger-50/50",
      iconBg: "bg-danger-100",
      iconColor: "text-danger-600",
      textColor: "text-danger-700",
    },
    info: {
      border: "border-indigo-200",
      bg: "bg-indigo-50/50",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      textColor: "text-indigo-900",
    },
  };

  const currentStyle = styles[variant] || styles.default;

  const content = (
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm border border-black/5 transition-all duration-300",
            currentStyle.iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", currentStyle.iconColor)} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider border",
              trend.positive
                ? "bg-success-100 text-success-700 border-success-200"
                : "bg-danger-100 text-danger-700 border-danger-200"
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
            {trend.label && <span className="hidden sm:inline opacity-70 ml-1">{trend.label}</span>}
          </div>
        )}
        {active && !trend && (
          <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-3xl font-mono font-black tracking-tighter leading-none transition-colors",
              currentStyle.textColor
            )}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {description && (
            <span className="text-xs font-bold text-zinc-400">
             {description}
            </span>
          )}
        </div>
      </div>
      
      {active && (
           <div className="absolute inset-x-4 bottom-0 h-1 bg-primary-500 rounded-t-full" /> 
      )}
    </div>
  );

  const containerClasses = cn(
    "relative flex flex-col h-[130px] w-full p-4 rounded-2xl border transition-all duration-300 card-industrial shadow-sm overflow-hidden",
    currentStyle.bg,
    currentStyle.border,
    active
      ? "border-primary-400 ring-4 ring-primary-500/10 shadow-xl shadow-primary-500/5 z-10 scale-[1.02]"
      : "hover:border-primary-300/50 hover:shadow-md",
    href && "hover-lift cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}

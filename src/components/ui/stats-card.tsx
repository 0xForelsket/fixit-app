import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "primary"
    | "secondary";
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
      border: "border-border",
      bg: "bg-card",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      textColor: "text-foreground",
    },
    primary: {
      border: "border-primary/30",
      bg: "bg-primary/10",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      textColor: "text-primary",
    },
    secondary: {
      border: "border-border",
      bg: "bg-muted/60",
      iconBg: "bg-card",
      iconColor: "text-muted-foreground",
      textColor: "text-foreground/80",
    },
    success: {
      border: "border-success-500/30",
      bg: "bg-success-500/15",
      iconBg: "bg-success-500/20",
      iconColor: "text-success-600",
      textColor: "text-success-700",
    },
    warning: {
      border: "border-warning-500/30",
      bg: "bg-warning-500/15",
      iconBg: "bg-warning-500/20",
      iconColor: "text-warning-600",
      textColor: "text-warning-700",
    },
    danger: {
      border: "border-danger-500/30",
      bg: "bg-danger-500/15",
      iconBg: "bg-danger-500/20",
      iconColor: "text-danger-600",
      textColor: "text-danger-700",
    },
    info: {
      border: "border-accent/30",
      bg: "bg-accent/15",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      textColor: "text-accent",
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
          <Icon
            className={cn("h-5 w-5", currentStyle.iconColor)}
            aria-hidden="true"
          />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider border",
              trend.positive
                ? "bg-success-500/10 text-success-700 border-success-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
            {trend.label && (
              <span className="hidden sm:inline opacity-70 ml-1">
                {trend.label}
              </span>
            )}
          </div>
        )}
        {active && !trend && (
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">
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
            <span className="text-xs font-bold text-muted-foreground/60">
              {description}
            </span>
          )}
        </div>
      </div>

      {active && (
        <div className="absolute inset-x-4 bottom-0 h-1 bg-primary rounded-t-full" />
      )}
    </div>
  );

  const containerClasses = cn(
    "relative flex flex-col h-[130px] w-full p-4 rounded-2xl border transition-all duration-300 card-industrial shadow-sm overflow-hidden",
    currentStyle.bg,
    currentStyle.border,
    active
      ? "border-primary/40 ring-4 ring-primary/10 shadow-xl shadow-primary/5 z-10 scale-[1.02]"
      : "hover:border-primary/30 hover:shadow-md",
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

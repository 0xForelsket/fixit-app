import { type BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function EntityDetailLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen pb-24 lg:pb-8", className)}>
      <div className="hidden lg:block print:block">
        <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">{children}</div>
      </div>
      <div className="lg:hidden print:hidden">{children}</div>
    </div>
  );
}

interface EntityHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  statusBadge?: ReactNode;
  parentLink: {
    href: string;
    label?: string; // e.g., "Back to Work Orders"
  };
  breadcrumbs?: BreadcrumbItem[];
  meta?: ReactNode;
  actions?: ReactNode;
}

export function EntityHeader({
  title,
  subtitle,
  badge,
  statusBadge,
  parentLink,
  breadcrumbs,
  meta,
  actions,
}: EntityHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={parentLink.href}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-foreground truncate font-serif-brand">
                {title}
              </h1>
              {badge && (
                <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                  {badge}
                </span>
              )}
              {subtitle && (
                <span className="text-lg text-muted-foreground/70 font-bold ml-2 hidden sm:inline-block">
                  {subtitle}
                </span>
              )}
            </div>
            {meta && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {meta}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {statusBadge}
        </div>
      </div>
    </div>
  );
}

export function EntityGrid({
  sidebar,
  content,
}: {
  sidebar: ReactNode;
  content: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 space-y-6">
        {sidebar}
      </div>
      <div className="flex-1 min-w-0 w-full">{content}</div>
    </div>
  );
}

interface EntityStatusCardProps {
  children: ReactNode;
  status?: string;
  statusLabel?: string;
  statusColor?: "zinc" | "blue" | "emerald" | "amber" | "red";
  icon: React.ElementType;
  statusBadge?: ReactNode;
}

export function EntityStatusCard({
  children,
  status,
  statusLabel = "Current Status",
  statusColor = "zinc",
  icon: Icon,
  statusBadge,
}: EntityStatusCardProps) {
  const colorStyles = {
    zinc: "bg-secondary border-border text-muted-foreground",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    red: "bg-red-50 border-red-100 text-red-600",
  };

  const badgeStyles = {
    zinc: "bg-secondary text-secondary-foreground border-border",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden card-premium">
      <div className="p-6">
        {/* Big Status Visual */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div
            className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center mb-4 border-[6px]",
              colorStyles[statusColor]
            )}
          >
            <Icon className="h-10 w-10" />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              {statusLabel}
            </div>
            {statusBadge || (
              <div
                className={cn(
                  "inline-flex items-center justify-center h-7 px-3 rounded-md border text-xs font-black uppercase tracking-wide",
                  badgeStyles[statusColor]
                )}
              >
                {status}
              </div>
            )}
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function EntityDetailItem({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("py-3 border-t border-zinc-100 first:border-0", className)}
    >
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
        {label}
      </span>
      {children || (
        <div className="text-sm font-bold text-zinc-900">{value}</div>
      )}
    </div>
  );
}

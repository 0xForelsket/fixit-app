import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  bgSymbol?: string;
  className?: string;
  compact?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  bgSymbol,
  className,
  compact = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn("animate-in relative", !compact && "space-y-8", className)}
    >
      {/* Background Decorative Element */}
      {bgSymbol && (
        <div
          className={cn(
            "absolute top-0 right-0 -z-10 opacity-[0.03] pointer-events-none select-none",
            compact ? "opacity-[0.015]" : "opacity-[0.03]"
          )}
        >
          <div
            className={cn(
              "font-black leading-none select-none",
              compact ? "text-[8rem]" : "text-[15rem]"
            )}
          >
            {bgSymbol}
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col sm:flex-row justify-between gap-6 border-b-2 border-foreground relative overflow-hidden",
          compact
            ? "sm:items-center pb-4 border-b"
            : "sm:items-end pb-8 border-b-2"
        )}
      >
        <div className="flex flex-col gap-1">
          {subtitle && (
            <div
              className={cn(
                "flex items-center gap-2 text-primary font-mono font-black uppercase tracking-[0.3em]",
                compact ? "text-[8px]" : "text-[10px]"
              )}
            >
              <span
                className={cn("h-px bg-primary", compact ? "w-4" : "w-8")}
              />
              {subtitle}
            </div>
          )}
          <h1
            className={cn(
              "font-serif font-black tracking-tighter text-foreground leading-[0.9]",
              compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "max-w-md text-muted-foreground font-mono font-bold uppercase tracking-wider leading-relaxed mt-1",
                compact ? "text-[8px]" : "text-[10px]"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}

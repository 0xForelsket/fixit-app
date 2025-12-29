import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  bgSymbol?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  bgSymbol,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-8 animate-in relative", className)}>
      {/* Background Decorative Element */}
      {bgSymbol && (
        <div className="absolute top-0 right-0 -z-10 opacity-[0.03] pointer-events-none select-none">
          <div className="text-[15rem] font-black leading-none select-none">
            {bgSymbol}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-foreground pb-8 relative overflow-hidden">
        <div className="flex flex-col gap-2">
          {subtitle && (
            <div className="flex items-center gap-2 text-primary font-mono text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="w-8 h-px bg-primary" />
              {subtitle}
            </div>
          )}
          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tighter text-foreground leading-[0.9]">
            {title}
          </h1>
          {description && (
            <p className="max-w-md text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider leading-relaxed mt-2">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

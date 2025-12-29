import { cn } from "@/lib/utils";
import type React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  highlight?: string;
  description?: React.ReactNode;
  icon?: React.ElementType;
  className?: string; // Additional classes for the container
  children?: React.ReactNode; // Actions (buttons)
}

export function PageHeader({
  title,
  highlight,
  description,
  icon: Icon,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-8",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase font-serif-brand">
          {title}{" "}
          {highlight && <span className="text-primary">{highlight}</span>}
        </h1>
        {description && (
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {description}
          </div>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      )}
    </div>
  );
}

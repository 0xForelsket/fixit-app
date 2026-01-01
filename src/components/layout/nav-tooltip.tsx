"use client";

import { cn } from "@/lib/utils";

interface NavTooltipProps {
  label: string;
  show: boolean;
  className?: string;
}

export function NavTooltip({ label, show, className }: NavTooltipProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-xl ring-1 ring-white/10",
        className
      )}
    >
      {label}
    </div>
  );
}

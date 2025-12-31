"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type * as React from "react";

export interface SegmentedControlOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl({
  options,
  selectedValue,
  className,
  size = "md",
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "flex rounded-lg border border-border bg-card overflow-hidden",
        size === "md" ? "h-9" : "h-8",
        className
      )}
    >
      {options.map((option) => {
        const isActive = selectedValue === option.value;

        const content = (
          <>
            {option.icon}
            <span>{option.label}</span>
          </>
        );

        const baseStyles = cn(
          "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 whitespace-nowrap border-r border-border last:border-0",
          isActive
            ? "bg-primary text-primary-foreground shadow-inner"
            : "text-muted-foreground hover:bg-muted active:bg-muted/80"
        );

        if (option.href) {
          return (
            <Link
              key={option.value}
              href={option.href}
              className={baseStyles}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            onClick={option.onClick}
            className={baseStyles}
            aria-pressed={isActive}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

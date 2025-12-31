"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

interface ResetFilterButtonProps {
  /** For URL-based navigation (server components) */
  href?: string;
  /** For client-side state reset */
  onClick?: () => void;
  /** Button text, defaults to "RESET ALL" */
  label?: string;
  /** Additional className */
  className?: string;
}

/**
 * A styled reset button with rotating X animation.
 * Supports both URL navigation (href) and client-side callbacks (onClick).
 */
export function ResetFilterButton({
  href,
  onClick,
  label = "RESET ALL",
  className,
}: ResetFilterButtonProps) {
  const buttonClasses = cn(
    "h-10 px-4 rounded-lg bg-background/50 border-2 border-border/40",
    "hover:border-danger hover:bg-danger/5 hover:text-danger",
    "text-[10px] font-black uppercase tracking-[0.1em]",
    "transition-all active:scale-95 group shadow-sm",
    className
  );

  const content = (
    <>
      <X className="mr-2 h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-200" />
      {label}
    </>
  );

  if (href) {
    return (
      <Button variant="outline" size="sm" className={buttonClasses} asChild>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={buttonClasses}
    >
      {content}
    </Button>
  );
}

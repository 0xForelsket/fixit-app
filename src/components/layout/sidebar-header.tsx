"use client";

import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, Wrench, X } from "lucide-react";
import Link from "next/link";

interface SidebarHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onNavClick?: () => void;
}

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  onClose,
  onNavClick,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-border transition-all duration-300",
        isCollapsed ? "justify-center px-0" : "justify-between px-4"
      )}
    >
      {!isCollapsed && (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group transition-all duration-300"
          onClick={onNavClick}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-serif-brand whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
            FixIt
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isCollapsed ? "flex" : "hidden lg:flex"
        )}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close sidebar"
        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

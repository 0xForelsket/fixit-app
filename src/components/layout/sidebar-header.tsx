"use client";

import { useOnlineStatus } from "@/hooks/use-offline";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, Wrench, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const { isOnline } = useOnlineStatus();
  const t = useTranslations("nav");

  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-border transition-all duration-300",
        isCollapsed
          ? "justify-center px-0 flex-col gap-2 py-2"
          : "justify-between px-4"
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

      <div className="flex items-center gap-2">
        {/* LED Connectivity Indicator */}
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-500 shadow-lg shrink-0",
            isOnline
              ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse"
              : "bg-red-500 shadow-red-500/50 animate-pulse duration-[1000ms]"
          )}
          title={isOnline ? t("networkOnline") : t("networkOffline")}
        />

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          className={cn(
            "rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isCollapsed ? "flex" : "hidden lg:flex"
          )}
          title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("closeSidebar")}
        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

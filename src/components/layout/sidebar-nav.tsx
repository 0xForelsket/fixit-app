"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTooltip } from "./nav-tooltip";
import type { NavGroup, NavItem } from "./sidebar-nav-config";

interface SidebarNavProps {
  groups: NavGroup[];
  isCollapsed?: boolean;
  collapsedSections: Set<string>;
  expandedSubmenus: Set<string>;
  canCreateTicket: boolean;
  onToggleSection: (key: string) => void;
  onToggleSubmenu: (href: string) => void;
  onNavClick?: () => void;
}

export function SidebarNav({
  groups,
  isCollapsed,
  collapsedSections,
  expandedSubmenus,
  canCreateTicket,
  onToggleSection,
  onToggleSubmenu,
  onNavClick,
}: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true;
    if (item.href !== "/dashboard" && pathname.startsWith(item.href)) {
      if (item.children?.some((c) => pathname === c.href)) {
        return false;
      }
      return true;
    }
    return false;
  };

  const isSubmenuActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(
      (child) =>
        pathname === child.href ||
        (child.href !== "/dashboard" && pathname.startsWith(child.href))
    );
  };

  return (
    <nav
      className={cn(
        "flex-1 p-3 custom-scrollbar",
        isCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
      )}
    >
      <div className="space-y-2">
        {groups.map((group) => {
          const isSectionCollapsed = collapsedSections.has(group.key);

          return (
            <div key={group.key}>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => onToggleSection(group.key)}
                  className="mb-2 px-3 flex items-center justify-between w-full text-left group cursor-pointer"
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 whitespace-nowrap overflow-hidden">
                    {t(group.key)}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-foreground/30 transition-transform duration-200",
                      isSectionCollapsed && "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="h-px bg-border/50 mx-2 mb-4" />
              )}

              <div
                className={cn(
                  "space-y-1 overflow-hidden transition-all duration-200",
                  isSectionCollapsed && !isCollapsed
                    ? "max-h-0 opacity-0"
                    : "max-h-[1000px] opacity-100"
                )}
              >
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item);
                    const hasChildren =
                      item.children && item.children.length > 0;
                    const isSubmenuExpanded =
                      expandedSubmenus.has(item.href) || isSubmenuActive(item);

                    return (
                      <li key={item.href}>
                        {hasChildren ? (
                          <NavItemWithSubmenu
                            item={item}
                            isCollapsed={isCollapsed}
                            isSubmenuExpanded={isSubmenuExpanded}
                            isSubmenuActive={isSubmenuActive(item)}
                            pathname={pathname}
                            onToggleSubmenu={onToggleSubmenu}
                            onNavClick={onNavClick}
                            label={t(item.key)}
                            // translate children map logic in sub component? No pass it down or translate here
                          />
                        ) : (
                          <NavItemLink
                            item={item}
                            isCollapsed={isCollapsed}
                            isActive={isActive}
                            onNavClick={onNavClick}
                            label={t(item.key)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {canCreateTicket && (
        <div
          className={cn(
            "mt-6 border-t border-border pt-4",
            isCollapsed && "flex justify-center"
          )}
        >
          <Link
            href="/report"
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors group relative",
              isCollapsed ? "w-10 h-10 justify-center px-0 py-0" : "px-3"
            )}
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                {t("reportIssue")}
              </span>
            )}
            <NavTooltip label={t("reportIssue")} show={!!isCollapsed} />
          </Link>
        </div>
      )}
    </nav>
  );
}

// Sub-component for nav items with submenus
interface NavItemWithSubmenuProps {
  item: NavItem;
  isCollapsed?: boolean;
  isSubmenuExpanded: boolean;
  isSubmenuActive: boolean;
  pathname: string;
  onToggleSubmenu: (href: string) => void;
  onNavClick?: () => void;
  label: string;
}

function NavItemWithSubmenu({
  item,
  isCollapsed,
  isSubmenuExpanded,
  isSubmenuActive,
  pathname,
  onToggleSubmenu,
  onNavClick,
  label,
}: NavItemWithSubmenuProps) {
  const t = useTranslations("nav");

  return (
    <>
      <button
        type="button"
        onClick={() => onToggleSubmenu(item.href)}
        className={cn(
          "flex items-center rounded-xl p-2.5 text-sm font-semibold transition-all group relative w-full cursor-pointer",
          isCollapsed ? "justify-center" : "gap-3 px-3",
          isSubmenuActive
            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
            : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "shrink-0 transition-colors",
            isSubmenuActive
              ? "text-primary"
              : "text-foreground/40 group-hover:text-primary"
          )}
        >
          {item.icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="whitespace-nowrap overflow-hidden flex-1 text-left">
              {label}
            </span>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-foreground/40 transition-transform duration-200",
                isSubmenuExpanded && "rotate-90"
              )}
            />
          </>
        )}
        <NavTooltip label={label} show={!!isCollapsed} />
        {isCollapsed && isSubmenuActive && (
          <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
        )}
      </button>
      {!isCollapsed && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isSubmenuExpanded
              ? "max-h-[500px] opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <ul className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-3">
            {item.children?.map((child) => {
              const isChildActive = pathname === child.href;
              const childLabel = t(child.key);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-2 text-sm font-medium transition-all group",
                      isChildActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 transition-colors",
                        isChildActive
                          ? "text-primary"
                          : "text-foreground/30 group-hover:text-primary"
                      )}
                    >
                      {child.icon}
                    </span>
                    <span>{childLabel}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

interface NavItemLinkProps {
  item: NavItem;
  isCollapsed?: boolean;
  isActive: boolean;
  onNavClick?: () => void;
  label: string;
}

function NavItemLink({
  item,
  isCollapsed,
  isActive,
  onNavClick,
  label,
}: NavItemLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={cn(
        "flex items-center rounded-xl p-2.5 text-sm font-semibold transition-all group relative",
        isCollapsed ? "justify-center" : "gap-3 px-3",
        isActive
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-foreground/40 group-hover:text-primary"
        )}
      >
        {item.icon}
      </span>
      {!isCollapsed && (
        <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
          {label}
        </span>
      )}
      <NavTooltip label={label} show={!!isCollapsed} />
      {isCollapsed && isActive && (
        <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
      )}
    </Link>
  );
}

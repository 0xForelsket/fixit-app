"use client";

import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { navGroups } from "./sidebar-nav-config";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUserMenu } from "./sidebar-user-menu";

const COLLAPSED_SECTIONS_KEY = "sidebar-collapsed-sections";
const EXPANDED_SUBMENUS_KEY = "sidebar-expanded-submenus";

interface SidebarProps {
  user: {
    name: string;
    roleName: string;
    employeeId: string;
    permissions: string[];
  };
  avatarUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  user,
  avatarUrl,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(
    new Set()
  );

  // Load collapsed sections and expanded submenus from localStorage
  useEffect(() => {
    try {
      const savedSections = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      if (savedSections) {
        setCollapsedSections(new Set(JSON.parse(savedSections)));
      }
      const savedSubmenus = localStorage.getItem(EXPANDED_SUBMENUS_KEY);
      if (savedSubmenus) {
        setExpandedSubmenus(new Set(JSON.parse(savedSubmenus)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      try {
        localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  const toggleSubmenu = useCallback((href: string) => {
    setExpandedSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      try {
        localStorage.setItem(EXPANDED_SUBMENUS_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  // Filter navigation groups based on user permissions
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => hasPermission(user.permissions, item.permission))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) =>
            hasPermission(user.permissions, child.permission)
          ),
        })),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const canCreateTicket = hasPermission(
    user.permissions,
    PERMISSIONS.TICKET_CREATE
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none print:hidden",
          isCollapsed ? "w-16" : "w-64 overflow-hidden",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          onClose={onClose}
          onNavClick={handleNavClick}
        />

        <SidebarNav
          groups={filteredGroups}
          isCollapsed={isCollapsed}
          collapsedSections={collapsedSections}
          expandedSubmenus={expandedSubmenus}
          canCreateTicket={canCreateTicket}
          onToggleSection={toggleSection}
          onToggleSubmenu={toggleSubmenu}
          onNavClick={handleNavClick}
        />

        <SidebarUserMenu
          user={user}
          avatarUrl={avatarUrl}
          isCollapsed={isCollapsed}
        />
      </aside>
    </>
  );
}

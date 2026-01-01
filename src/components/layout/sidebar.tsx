"use client";

import { logout } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  Cog,
  DollarSign,
  Download,
  Factory,
  FileText,
  Folder,
  Globe,
  HelpCircle,
  Home,
  Keyboard,
  LogOut,
  MapPin,
  MonitorCog,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  User,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NavTooltip } from "./nav-tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="h-5 w-5" />,
        permission: PERMISSIONS.ANALYTICS_VIEW,
        children: [
          {
            label: "Overview",
            href: "/analytics",
            icon: <BarChart3 className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Costs",
            href: "/analytics/costs",
            icon: <DollarSign className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
          {
            label: "Downtime",
            href: "/analytics/downtime",
            icon: <Clock className="h-4 w-4" />,
            permission: PERMISSIONS.ANALYTICS_VIEW,
          },
        ],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: <FileText className="h-5 w-5" />,
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: <Folder className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
    ],
  },
  {
    label: "Maintenance",
    items: [
      {
        label: "Work Orders",
        href: "/maintenance/work-orders",
        icon: <ClipboardList className="h-5 w-5" />,
        permission: PERMISSIONS.TICKET_VIEW_ALL,
      },
      {
        label: "Schedules",
        href: "/maintenance/schedules",
        icon: <Wrench className="h-5 w-5" />,
        permission: PERMISSIONS.MAINTENANCE_VIEW,
      },
    ],
  },
  {
    label: "Asset Management",
    items: [
      {
        label: "Equipment",
        href: "/assets/equipment",
        icon: <MonitorCog className="h-5 w-5" />,
        permission: PERMISSIONS.EQUIPMENT_VIEW,
      },
      {
        label: "Locations",
        href: "/assets/locations",
        icon: <MapPin className="h-5 w-5" />,
        permission: PERMISSIONS.LOCATION_VIEW,
      },
      {
        label: "Inventory",
        href: "/assets/inventory",
        icon: <Package className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
      {
        label: "Vendors",
        href: "/assets/vendors",
        icon: <Factory className="h-5 w-5" />,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "System",
        href: "/admin/system",
        icon: <Settings2 className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
    ],
  },
];

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
  const pathname = usePathname();
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

  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true;
    if (item.href !== "/dashboard" && pathname.startsWith(item.href)) {
      // Don't mark parent as active if we're in a child route and parent has children
      if (item.children && item.children.some((c) => pathname === c.href)) {
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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none print:hidden",
          isCollapsed ? "w-16" : "w-64 overflow-hidden",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
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
              onClick={handleNavClick}
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

        <nav
          className={cn(
            "flex-1 p-3 custom-scrollbar",
            isCollapsed
              ? "overflow-visible"
              : "overflow-y-auto overflow-x-hidden"
          )}
        >
          <div className="space-y-2">
            {filteredGroups.map((group) => {
              const isSectionCollapsed = collapsedSections.has(group.label);

              return (
                <div key={group.label}>
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(group.label)}
                      className="mb-2 px-3 flex items-center justify-between w-full text-left group cursor-pointer"
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 whitespace-nowrap overflow-hidden">
                        {group.label}
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
                          expandedSubmenus.has(item.href) ||
                          isSubmenuActive(item);

                        return (
                          <li key={item.href}>
                            {hasChildren ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleSubmenu(item.href)}
                                  className={cn(
                                    "flex items-center rounded-xl p-2.5 text-sm font-semibold transition-all group relative w-full cursor-pointer",
                                    isCollapsed
                                      ? "justify-center"
                                      : "gap-3 px-3",
                                    isSubmenuActive(item)
                                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                      : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "shrink-0 transition-colors",
                                      isSubmenuActive(item)
                                        ? "text-primary"
                                        : "text-foreground/40 group-hover:text-primary"
                                    )}
                                  >
                                    {item.icon}
                                  </span>
                                  {!isCollapsed && (
                                    <>
                                      <span className="whitespace-nowrap overflow-hidden flex-1 text-left">
                                        {item.label}
                                      </span>
                                      <ChevronRight
                                        className={cn(
                                          "h-4 w-4 text-foreground/40 transition-transform duration-200",
                                          isSubmenuExpanded && "rotate-90"
                                        )}
                                      />
                                    </>
                                  )}
                                  <NavTooltip
                                    label={item.label}
                                    show={!!isCollapsed}
                                  />
                                  {isCollapsed && isSubmenuActive(item) && (
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
                                        const isChildActive =
                                          pathname === child.href;
                                        return (
                                          <li key={child.href}>
                                            <Link
                                              href={child.href}
                                              onClick={handleNavClick}
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
                                              <span>{child.label}</span>
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={handleNavClick}
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
                                    {item.label}
                                  </span>
                                )}
                                <NavTooltip
                                  label={item.label}
                                  show={!!isCollapsed}
                                />
                                {isCollapsed && isActive && (
                                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                                )}
                              </Link>
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
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors group relative",
                  isCollapsed ? "w-10 h-10 justify-center px-0 py-0" : "px-3"
                )}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    Report Issue
                  </span>
                )}
                <NavTooltip label="Report Issue" show={!!isCollapsed} />
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center rounded-2xl bg-muted/30 p-2 transition-all hover:bg-muted/50 border border-border group relative outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCollapsed ? "justify-center px-2" : "gap-3 p-3"
                )}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted font-bold text-xs uppercase">
                      {user.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-1 flex-col text-left overflow-hidden animate-in fade-in slide-in-from-left-2">
                      <p className="truncate text-sm font-bold text-foreground leading-tight">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex-none rounded bg-muted px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground border border-border">
                          {user.roleName}
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                  </>
                )}
                <NavTooltip label={user.name} show={!!isCollapsed} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 z-[100]"
              side={isCollapsed ? "right" : "top"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.employeeId} - {user.roleName}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile/settings"
                    className="w-full cursor-pointer"
                  >
                    <Cog className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Language</span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-70">
                    (Coming Soon)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="w-full cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Get help</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("toggle-keyboard-shortcuts")
                    )
                  }
                  className="cursor-pointer"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  <span>Keyboard Shortcuts</span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-70">
                    ?
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/install" className="w-full cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download App</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}

"use client";

import { logout } from "@/actions/auth";
import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Cog,
  FileText,
  Home,
  LogOut,
  MapPin,
  MonitorCog,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Shield,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
}

interface NavGroup {
  label?: string;
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
      },
      {
        label: "Reports",
        href: "/reports",
        icon: <FileText className="h-5 w-5" />,
        permission: PERMISSIONS.REPORTS_VIEW,
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
        label: "QR Codes",
        href: "/assets/qr-codes",
        icon: <QrCode className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_QR_CODES,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: <Users className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        label: "Roles",
        href: "/admin/roles",
        icon: <Shield className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
      },
      {
        label: "Import",
        href: "/admin/import",
        icon: <Upload className="h-5 w-5" />,
        permission: PERMISSIONS.EQUIPMENT_CREATE,
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: <Cog className="h-5 w-5" />,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
      },
    ],
  },
];

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

export function Sidebar({ user, avatarUrl, isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasPermission(user.permissions, item.permission)
      ),
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
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none overflow-hidden",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className={cn(
          "flex h-16 items-center border-b border-border transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between px-4"
        )}>
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
            className={cn(
              "rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
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
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
          <div className="space-y-6">
            {filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.label && !isCollapsed && (
                  <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    {group.label}
                  </h3>
                )}
                {isCollapsed && group.label && (
                  <div className="h-px bg-border/50 mx-2 mb-4" />
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          title={isCollapsed ? item.label : undefined}
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
                          {isCollapsed && isActive && (
                            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {canCreateTicket && (
            <div className={cn("mt-6 border-t border-border pt-4", isCollapsed && "flex justify-center")}>
              <Link
                href="/"
                onClick={handleNavClick}
                title={isCollapsed ? "Report Equipment Issue" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors",
                  isCollapsed ? "w-10 h-10 justify-center px-0 py-0" : "px-3"
                )}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2">
                    Report Issue
                  </span>
                )}
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/profile"
            onClick={handleNavClick}
            title={isCollapsed ? user.name : undefined}
            className={cn(
              "mb-3 flex items-center rounded-2xl bg-muted/30 p-2 transition-all hover:bg-muted/50 border border-border group",
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
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2">
                <p className="truncate text-sm font-bold text-foreground leading-tight">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex-none rounded bg-muted px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground border border-border">
                    {user.roleName}
                  </span>
                </div>
              </div>
            )}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              data-testid="sign-out-button"
              className={cn(
                "flex w-full items-center transition-colors group",
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              )}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className={cn("h-5 w-5 transition-transform", !isCollapsed && "group-hover:-translate-x-1", isCollapsed ? "text-muted-foreground hover:text-destructive" : "")} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

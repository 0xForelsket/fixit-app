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
}

export function Sidebar({ user, avatarUrl, isOpen, onClose }: SidebarProps) {
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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
            onClick={handleNavClick}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-serif-brand">
              FixIt
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.label && (
                  <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">
                    {group.label}
                  </h3>
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
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all group",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                              : "text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-foreground/40 group-hover:text-primary transition-colors"
                            )}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {canCreateTicket && (
            <div className="mt-6 border-t border-border pt-4">
              <Link
                href="/"
                onClick={handleNavClick}
                className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Equipment Issue
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/profile"
            onClick={handleNavClick}
            className="mb-3 flex items-center gap-3 rounded-2xl bg-muted/30 p-3 transition-all hover:bg-muted/50 border border-border group"
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
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-foreground leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex-none rounded bg-muted px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground border border-border">
                  {user.roleName}
                </span>
                <p className="truncate text-[11px] font-mono text-muted-foreground/70">
                  {user.employeeId}
                </p>
              </div>
            </div>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              data-testid="sign-out-button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

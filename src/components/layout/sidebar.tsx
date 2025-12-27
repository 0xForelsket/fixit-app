"use client";

import { logout } from "@/actions/auth";
import type { UserRole } from "@/db/schema";
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

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    permission: PERMISSIONS.TICKET_VIEW_ALL,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    permission: PERMISSIONS.ANALYTICS_VIEW,
  },
  {
    label: "Work Orders",
    href: "/dashboard/work-orders",
    icon: <ClipboardList className="h-5 w-5" />,
    permission: PERMISSIONS.TICKET_VIEW_ALL,
  },
  {
    label: "Equipment",
    href: "/admin/equipment",
    icon: <MonitorCog className="h-5 w-5" />,
    permission: PERMISSIONS.EQUIPMENT_CREATE,
  },
  {
    label: "Locations",
    href: "/admin/locations",
    icon: <MapPin className="h-5 w-5" />,
    permission: PERMISSIONS.LOCATION_CREATE,
  },
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
    label: "Maintenance",
    href: "/dashboard/maintenance",
    icon: <Wrench className="h-5 w-5" />,
    permission: PERMISSIONS.MAINTENANCE_VIEW,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: <Package className="h-5 w-5" />,
    permission: PERMISSIONS.INVENTORY_CREATE,
  },
  {
    label: "QR Codes",
    href: "/admin/qr-codes",
    icon: <QrCode className="h-5 w-5" />,
    permission: PERMISSIONS.SYSTEM_QR_CODES,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: <FileText className="h-5 w-5" />,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Cog className="h-5 w-5" />,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
];

interface SidebarProps {
  user: {
    name: string;
    role: UserRole;
    employeeId: string;
    permissions: string[];
  };
  avatarUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, avatarUrl, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) =>
    hasPermission(user.permissions, item.permission)
  );

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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
            onClick={handleNavClick}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              FixIt
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-primary-500/10 text-primary-500 border-l-2 border-primary-500 rounded-l-none"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-colors",
                        isActive
                          ? "text-primary-500"
                          : "group-hover:text-primary-500"
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

          {canCreateTicket && (
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <Link
                href="/"
                onClick={handleNavClick}
                className="flex items-center gap-3 rounded-lg bg-primary-500/10 border border-primary-500/20 px-3 py-2.5 text-sm font-semibold text-primary-500 hover:bg-primary-500/20 transition-colors"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Equipment Issue
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <Link
            href="/profile"
            onClick={handleNavClick}
            className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-900 p-3 transition-all hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 group"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-800 shadow-sm ring-1 ring-zinc-700 group-hover:ring-primary-500/50 transition-all">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400 bg-zinc-800 font-bold text-xs uppercase">
                  {user.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex-none rounded bg-zinc-800 px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-zinc-400 border border-zinc-700">
                  {user.role}
                </span>
                <p className="truncate text-[11px] font-mono text-zinc-500">
                  {user.employeeId}
                </p>
              </div>
            </div>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-danger-500/10 hover:text-danger-500 transition-colors group"
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

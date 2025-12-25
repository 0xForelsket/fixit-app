"use client";

import { logout } from "@/actions/auth";
import type { UserRole } from "@/db/schema";
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
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    roles: ["tech", "admin"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["tech", "admin"],
  },
  {
    label: "Equipment",
    href: "/admin/equipment",
    icon: <MonitorCog className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Locations",
    href: "/admin/locations",
    icon: <MapPin className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Maintenance",
    href: "/dashboard/maintenance",
    icon: <Wrench className="h-5 w-5" />,
    roles: ["admin", "tech"],
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: <Package className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "QR Codes",
    href: "/admin/qr-codes",
    icon: <QrCode className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: <FileText className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Cog className="h-5 w-5" />,
    roles: ["admin"],
  },
];

interface SidebarProps {
  user: {
    name: string;
    role: UserRole;
    employeeId: string;
  };
  avatarUrl?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, avatarUrl, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-white transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none industrial-grid",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Header with close button on mobile */}
        <div className="flex h-16 items-center justify-between border-b px-6 bg-white/50 backdrop-blur-md">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
            onClick={handleNavClick}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              FixIt
            </span>
          </Link>
          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
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
                        ? "bg-primary-50 text-primary-600 shadow-sm shadow-primary-500/10 border-l-2 border-primary-500 rounded-l-none"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "transition-colors",
                        isActive
                          ? "text-primary-600"
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

          {/* Quick Report Link for Techs */}
          {user.role === "tech" && (
            <div className="mt-6 border-t pt-4">
              <Link
                href="/"
                onClick={handleNavClick}
                className="flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2.5 text-sm font-semibold text-primary-700 hover:bg-orange-100 transition-colors shadow-sm animate-pulse-subtle"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Equipment Issue
              </Link>
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t p-4 bg-white/50 backdrop-blur-sm">
          <Link
            href="/profile"
            onClick={handleNavClick}
            className="mb-3 flex items-center gap-3 rounded-xl bg-secondary-50 p-3 transition-all hover:bg-secondary-100 border border-transparent hover:border-secondary-200 group"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-zinc-200 group-hover:ring-primary-400/50 transition-all">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400 bg-zinc-50 font-bold text-xs uppercase">
                  {user.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-zinc-900 leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex-none rounded bg-white px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-zinc-500 border border-zinc-200">
                  {user.role}
                </span>
                <p className="truncate text-[11px] font-mono text-zinc-400">
                  {user.employeeId}
                </p>
              </div>
            </div>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-danger-50 hover:text-danger-600 transition-colors group"
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

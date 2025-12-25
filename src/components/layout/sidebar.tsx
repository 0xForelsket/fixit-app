"use client";

import { logout } from "@/actions/auth";
import type { UserRole } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
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
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["tech", "admin"],
  },
  {
    label: "Machines",
    href: "/admin/machines",
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
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-white shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header with close button on mobile */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
            <Wrench className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-primary-600">FixIt</span>
          </Link>
          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
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
                className="flex items-center gap-3 rounded-lg bg-warning-100 px-3 py-2 text-sm font-medium text-warning-700 hover:bg-warning-200"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Issue
              </Link>
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t p-4">
          <Link
            href="/profile"
            onClick={handleNavClick}
            className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-3 transition-colors hover:bg-muted/80"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-background bg-background shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.employeeId} • {user.role}
              </p>
            </div>
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

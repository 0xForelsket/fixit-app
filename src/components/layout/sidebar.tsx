"use client";

import type { UserRole } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Cog,
  Home,
  LogOut,
  MapPin,
  MonitorCog,
  Users,
  Wrench,
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
    label: "Schedules",
    href: "/admin/schedules",
    icon: <Calendar className="h-5 w-5" />,
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
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-bold text-primary-600">FixIt</span>
        </Link>
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
        <div className="mb-3 rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.employeeId} • {user.role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

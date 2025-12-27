"use client";

import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { AlertTriangle, ClipboardList, Home, User, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  permissions: string[];
}

export function BottomNav({ permissions }: BottomNavProps) {
  const pathname = usePathname();

  const canCreateTicket = hasPermission(permissions, PERMISSIONS.TICKET_CREATE);

  const leftNavItems: {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission?: Permission;
  }[] = [
    {
      label: "Home",
      href: hasPermission(permissions, PERMISSIONS.TICKET_VIEW_ALL)
        ? "/dashboard"
        : "/",
      icon: <Home className="h-6 w-6" />,
    },
    {
      label: "WOs",
      href: hasPermission(permissions, PERMISSIONS.TICKET_VIEW_ALL)
        ? "/maintenance/work-orders"
        : "/my-work-orders",
      icon: <ClipboardList className="h-6 w-6" />,
    },
  ];

  const rightNavItems: {
    label: string;
    href: string;
    icon: React.ReactNode;
    permission?: Permission;
  }[] = [
    {
      label: "Services",
      href: "/maintenance/schedules",
      icon: <Wrench className="h-6 w-6" />,
      permission: PERMISSIONS.MAINTENANCE_VIEW,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-6 w-6" />,
    },
  ].filter(
    (item) => !item.permission || hasPermission(permissions, item.permission)
  );

  const renderNavItem = (item: typeof leftNavItems[0]) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.href} className="flex-1">
        <Link
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 transition-all min-h-[64px]",
            isActive
              ? "text-primary-500"
              : "text-zinc-500 active:text-zinc-300"
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
              isActive
                ? "bg-primary-500/20 shadow-lg shadow-primary-500/20"
                : "active:bg-zinc-800"
            )}
          >
            {item.icon}
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            isActive && "text-primary-400"
          )}>
            {item.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-bottom">
      {/* Dark nav bar */}
      <div className="bg-zinc-950 border-t border-zinc-800 px-2">
        <ul className="flex h-[72px] items-center justify-around">
          {/* Left nav items */}
          {leftNavItems.map(renderNavItem)}

          {/* Center FAB spacer or FAB */}
          {canCreateTicket ? (
            <li className="flex-1 flex justify-center">
              <div className="w-16" /> {/* Spacer for FAB */}
            </li>
          ) : null}

          {/* Right nav items */}
          {rightNavItems.map(renderNavItem)}
        </ul>
      </div>

      {/* Floating Action Button for Report Issue */}
      {canCreateTicket && (
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 active:scale-95 transition-transform"
        >
          <AlertTriangle className="h-6 w-6" />
        </Link>
      )}
    </nav>
  );
}

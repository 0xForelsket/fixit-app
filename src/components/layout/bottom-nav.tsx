"use client";

import { QRScanner } from "@/components/ui/qr-scanner";
import { PERMISSIONS, type Permission, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ClipboardList, Home, ScanLine, User, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface BottomNavProps {
  permissions: string[];
}

export function BottomNav({ permissions }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const canCreateTicket = hasPermission(permissions, PERMISSIONS.TICKET_CREATE);

  const handleScan = (code: string) => {
    setIsScannerOpen(false);
    router.push(`/equipment/${code}`);
  };

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

  const renderNavItem = (item: (typeof leftNavItems)[0]) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.href} className="flex-1 h-full">
        <Link
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all h-full min-h-[64px] relative group",
            isActive
              ? "text-primary"
              : "text-muted-foreground active:text-foreground/70"
          )}
        >
          {/* Active background indicator for the whole area */}
          <div
            className={cn(
              "absolute inset-x-1 inset-y-1 rounded-xl transition-colors",
              isActive ? "bg-primary/10" : "group-active:bg-muted/50"
            )}
          />

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all relative z-10",
              isActive
                ? "bg-primary/20 shadow-lg shadow-primary/20 text-primary"
                : ""
            )}
          >
            {item.icon}
          </div>
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider relative z-10",
              isActive && "text-primary"
            )}
          >
            {item.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden isolate print:hidden">
      {/* Glassmorphic nav bar with safe area padding */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
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

      {canCreateTicket && (
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/90 backdrop-blur-md text-primary-foreground shadow-[0_8px_32px_rgba(var(--primary),0.3)] active:scale-95 transition-all cursor-pointer border-4 border-background/20 z-[60]"
          aria-label="Scan Equipment"
        >
          <ScanLine className="h-6 w-6" />
        </button>
      )}

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </nav>
  );
}

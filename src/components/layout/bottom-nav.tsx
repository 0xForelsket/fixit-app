"use client";

import { cn } from "@/lib/utils";
import { ClipboardList, Home, User, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/db/schema";

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: role === "operator" ? "/" : "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Tickets",
      href: role === "operator" ? "/my-tickets" : "/dashboard/tickets",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      label: "Services",
      href: "/dashboard/maintenance",
      icon: <Wrench className="h-5 w-5" />,
      roles: ["tech", "admin"],
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
  ].filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-white/80 backdrop-blur-lg lg:hidden px-4 safe-area-bottom">
      <ul className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 transition-colors",
                  isActive ? "text-primary-600" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                    isActive && "bg-primary-50 shadow-sm"
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

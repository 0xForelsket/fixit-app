"use client";

import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/session";
import { LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface OperatorNavProps {
  user: SessionUser;
  unreadCount: number;
  avatarUrl?: string | null;
}

export function OperatorNav({
  user,
  unreadCount,
  avatarUrl,
}: OperatorNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Equipment" },
    { href: "/my-tickets", label: "My Tickets" },
  ];

  return (
    <div className="flex items-center gap-4">
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 text-sm font-bold rounded-lg transition-colors min-h-[48px] flex items-center ${
              pathname === item.href
                ? "bg-primary-500/10 text-primary-600"
                : "text-zinc-500 hover:bg-primary-50 hover:text-primary-600"
            }`}
          >
            {item.label}
            {item.href === "/my-tickets" && unreadCount > 0 && (
              <Badge variant="danger" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 hover:bg-zinc-100 p-2 rounded-lg transition-colors group outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900 group-hover:text-primary-600 transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {user.roleName}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-50 shadow-sm group-hover:border-primary-300 group-hover:ring-2 group-hover:ring-primary-100 transition-all">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <Users className="h-4 w-4" />
                  </div>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
              }}
              className="w-full cursor-pointer text-danger-600 focus:text-danger-600 focus:bg-danger-50 font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

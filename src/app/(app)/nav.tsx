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
import { cn } from "@/lib/utils";
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
            className={cn(
              "px-4 py-3 text-sm font-bold rounded-lg transition-colors min-h-[48px] flex items-center",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
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

      <div className="flex items-center gap-3 border-l border-border pl-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors group outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {user.roleName}
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm group-hover:border-primary/50 group-hover:ring-2 group-hover:ring-primary/10 transition-all">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
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
              className="w-full cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
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

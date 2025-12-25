"use client";

import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/session";
import { Users } from "lucide-react";
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
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === item.href
                ? "bg-primary-100 text-primary-700"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <div className="flex items-center gap-3 border-l pl-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 hover:bg-muted/50 p-1.5 rounded-lg transition-colors group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
              {user.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {user.role}
            </p>
          </div>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50 shadow-sm group-hover:border-primary-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Users className="h-4 w-4" />
              </div>
            )}
          </div>
        </Link>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-rose-600"
          >
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

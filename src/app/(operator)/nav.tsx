"use client";

import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/session";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface OperatorNavProps {
  user: SessionUser;
  unreadCount: number;
}

export function OperatorNav({ user, unreadCount }: OperatorNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Machines" },
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
        <Link href="/profile" className="text-right hover:opacity-80 transition-opacity">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user.role}
          </p>
        </Link>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

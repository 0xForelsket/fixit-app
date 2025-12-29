import { OperatorNav } from "@/app/(app)/nav";
import type { SessionUser } from "@/lib/session";
import Link from "next/link";

interface UserHeaderProps {
  user: SessionUser;
  avatarUrl: string | null;
  unreadCount: number;
}

export function UserHeader({ user, avatarUrl, unreadCount }: UserHeaderProps) {
  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-serif-brand">
              FixIt
            </span>
          </Link>

          <OperatorNav
            user={user}
            unreadCount={unreadCount}
            avatarUrl={avatarUrl}
          />
        </div>
      </header>
    </>
  );
}

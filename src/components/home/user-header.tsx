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
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
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

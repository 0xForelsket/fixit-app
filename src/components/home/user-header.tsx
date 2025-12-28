import { OperatorNav } from "@/app/(operator)/nav";
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

      {/* User Greeting Area */}
      <div className="flex items-center justify-between bg-primary-600 p-6 rounded-3xl text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-primary-100 text-sm font-medium mt-1">
            Carey Manufacturing Sdn Bhd
          </p>
        </div>
        <div className="relative z-10 h-12 w-12 rounded-full border-2 border-white/30 overflow-hidden bg-white/20 backdrop-blur-sm">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      </div>
    </>
  );
}

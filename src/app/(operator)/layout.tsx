import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OperatorNav } from "./nav";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect based on role
  if (user.role === "admin") {
    redirect("/admin");
  } else if (user.role === "tech") {
    redirect("/dashboard");
  }

  const avatarUrl = await getUserAvatarUrl(user.id);

  // Get unread notification count
  const unreadCount = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    )
    .then((rows) => rows.length);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold shadow-md">
              F
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
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

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

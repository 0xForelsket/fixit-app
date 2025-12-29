import { LandingPage } from "@/components/home/landing-page";
import { QuickActions } from "@/components/home/quick-actions";
import { UserHeader } from "@/components/home/user-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { db } from "@/db";
import { equipment, notifications } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq, ilike, sql } from "drizzle-orm";

import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentGrid } from "./(operator)/equipment-grid";
import { EquipmentSearch } from "./(operator)/equipment-search";
import { RecentEquipment } from "@/components/home/recent-equipment";

interface PageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  if (hasPermission(user.permissions, PERMISSIONS.TICKET_VIEW_ALL)) {
    redirect("/dashboard");
  }

  // Get avatar URL
  const avatarUrl = await getUserAvatarUrl(user.id);

  // Operator interface
  const params = await searchParams;
  const search = params.search || "";
  const locationId = params.location ? Number(params.location) : undefined;

  // Fetch equipment with location info
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${ilike(equipment.name, `%${search}%`)} OR ${ilike(equipment.code, `%${search}%`)})`
    );
  }

  if (locationId) {
    conditions.push(eq(equipment.locationId, locationId));
  }

  const whereClause =
    conditions.length > 0
      ? conditions.length > 1
        ? and(...conditions)
        : conditions[0]
      : undefined;

  const equipmentList = await db.query.equipment.findMany({
    where: whereClause,
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
    with: {
      location: true,
    },
  });

  // Get location list for filtering
  const locationList = await db.query.locations.findMany({
    orderBy: (locations, { asc }) => [asc(locations.name)],
  });



  // Get unread notification count
  const unreadCount = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    )
    .then((rows) => rows.length);

  return (
    <div className="min-h-screen bg-zinc-50/50 industrial-grid pb-20 lg:pb-0">
      <UserHeader user={user} avatarUrl={avatarUrl} unreadCount={unreadCount} />

      {/* Main content */}
      <main className="container mx-auto px-4 pt-4 pb-20 max-w-5xl space-y-6 animate-in">
        <QuickActions />

        <RecentEquipment />

        {/* Equipment Search Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
              Monitor Assets
            </h2>
            <Link
              href="/"
              className="text-[10px] font-bold text-zinc-400 hover:text-primary-600 uppercase tracking-widest transition-colors"
            >
              See All
            </Link>
          </div>
          <EquipmentSearch locations={locationList} initialSearch={search} />
          <EquipmentGrid equipment={equipmentList} />
        </section>
      </main>
      <BottomNav permissions={user.permissions} />
    </div>
  );
}

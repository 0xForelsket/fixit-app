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
import { BottomNav } from "@/components/layout/bottom-nav";
import { LandingPage } from "@/components/home/landing-page";
import { PMStats } from "@/components/home/pm-stats";
import { QuickActions } from "@/components/home/quick-actions";
import { UserHeader } from "@/components/home/user-header";
import { WorkOrderStats } from "@/components/home/work-order-stats";

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

  // Count tickets per equipment status
  const statusCounts = {
    operational: equipmentList.filter((m) => m.status === "operational").length,
    down: equipmentList.filter((m) => m.status === "down").length,
    maintenance: equipmentList.filter((m) => m.status === "maintenance").length,
  };

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
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-10 animate-in">
        <QuickActions />

        {/* Status Summaries */}
        <section className="space-y-6">
          <WorkOrderStats statusCounts={statusCounts} />
          <PMStats />
        </section>

        {/* Equipment Search Section (Keep but optimize) */}
        <section className="pt-10 border-t">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Monitor Assets
            </h2>
            <Link
              href="/"
              className="text-sm font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
            >
              See All
            </Link>
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-zinc-200 shadow-sm backdrop-blur-sm mb-6">
            <EquipmentSearch locations={locationList} initialSearch={search} />
          </div>
          <EquipmentGrid equipment={equipmentList} />
        </section>
      </main>
      <BottomNav permissions={user.permissions} />
    </div>
  );
}

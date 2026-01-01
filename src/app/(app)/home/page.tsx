import { QuickActions } from "@/components/home/quick-actions";
import { RecentEquipment } from "@/components/home/recent-equipment";
import { UserHeader } from "@/components/home/user-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { WorkOrderCard } from "@/components/work-orders/work-order-card";
import { db } from "@/db";
import { equipment, notifications, workOrders } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq, like, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentGrid } from "../equipment-grid";
import { EquipmentSearch } from "../equipment-search";

interface PageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (hasPermission(user.permissions, PERMISSIONS.TICKET_VIEW_ALL)) {
    redirect("/dashboard");
  }

  // Get avatar URL
  const avatarUrl = await getUserAvatarUrl(user.id);

  // Operator interface logic
  const params = await searchParams;
  const search = params.search || "";
  const locationId = params.location ? Number(params.location) : undefined;

  // Fetch equipment with location info
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${like(equipment.name, `%${search}%`)} OR ${like(equipment.code, `%${search}%`)})`
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
      children: {
        columns: { id: true },
      },
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

  // Fetch operator's active requests
  const myWorkOrders = await db.query.workOrders.findMany({
    where: and(
      eq(workOrders.reportedById, user.id),
      sql`${workOrders.status} != 'closed'`
    ),
    limit: 5,
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
      reportedBy: true,
      assignedTo: true,
    },
  });

  return (
    <div className="min-h-screen bg-background/50 industrial-grid pb-20 lg:pb-0 transition-colors duration-500">
      <UserHeader user={user} avatarUrl={avatarUrl} unreadCount={unreadCount} />

      {/* Main content */}
      <main className="container mx-auto px-4 pt-4 pb-20 max-w-5xl space-y-8 animate-in">
        <QuickActions />

        {myWorkOrders.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                My Active Requests
              </h2>
              <Link
                href="/my-tickets"
                className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {myWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <WorkOrderCard workOrder={wo} variant="compact" />
                </div>
              ))}
            </div>
          </section>
        )}

        <RecentEquipment />

        {/* Equipment Search Section */}
        <section className="space-y-4 pt-4 border-t border-border/10">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
              Asset Directory
            </h2>
            <Link
              href="/assets/equipment"
              className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
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

import { StatusCard } from "@/components/ui/status-card";
import { db } from "@/db";
import { equipment, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq, ilike, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentGrid } from "./(operator)/equipment-grid";
import { EquipmentSearch } from "./(operator)/equipment-search";
import { OperatorNav } from "./(operator)/nav";

interface PageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Landing page for unauthenticated users
  if (!user) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center p-8 industrial-grid overflow-hidden bg-gradient-to-br from-zinc-50 to-orange-50/30">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative text-center max-w-2xl animate-in">
          <div className="mb-8 flex justify-center">
            <div className="group relative">
              <div className="absolute inset-0 bg-primary-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-4xl font-bold text-white shadow-2xl">
                F
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-black tracking-tight mb-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
            FixIt <span className="text-primary-600">CMMS</span>
          </h1>

          <p className="text-xl text-zinc-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
            High-precision maintenance management for modern industrial
            environments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all text-lg"
            >
              Sign In to Station
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-200/50 flex flex-wrap justify-center gap-x-10 gap-y-4 text-zinc-400 font-mono text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              Real-time Tracking
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              Equipment BOMs
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary-500" />
              Maintenance Logs
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Redirect based on role
  if (user.role === "admin") {
    redirect("/admin");
  } else if (user.role === "tech") {
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
    <div className="min-h-screen bg-zinc-50/50 industrial-grid">
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

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-10 animate-in">
        {/* Page header & Stats */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
              Equipment Status
            </h1>
            <p className="text-zinc-500 mt-2 font-medium">
              Real-time monitoring and issue reporting station
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <StatusCard
              label="Operational"
              count={statusCounts.operational}
              status="operational"
            />
            <StatusCard label="Down" count={statusCounts.down} status="down" />
            <StatusCard
              label="Maint."
              count={statusCounts.maintenance}
              status="maintenance"
            />
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-white/50 p-6 rounded-2xl border border-zinc-200 shadow-sm backdrop-blur-sm">
          <EquipmentSearch locations={locationList} initialSearch={search} />
        </div>

        {/* Equipment grid */}
        <div className="relative">
          <EquipmentGrid equipment={equipmentList} />
        </div>
      </main>
    </div>
  );
}

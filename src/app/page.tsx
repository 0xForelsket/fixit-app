import { db } from "@/db";
import { machines, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq, ilike, sql } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, Info, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MachineGrid } from "./(operator)/machine-grid";
import { MachineSearch } from "./(operator)/machine-search";
import { OperatorNav } from "./(operator)/nav";

interface PageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Landing page for unauthenticated users
  if (!user) {
    // ... same as before ...
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 text-3xl font-bold text-white">
              F
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary-600 mb-4">FixIt</h1>
          <p className="text-lg text-muted-foreground mb-8">
            CMMS Lite - Machine Maintenance Tracking
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
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

  // Fetch machines with location info
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${ilike(machines.name, `%${search}%`)} OR ${ilike(machines.code, `%${search}%`)})`
    );
  }

  if (locationId) {
    conditions.push(eq(machines.locationId, locationId));
  }

  const whereClause =
    conditions.length > 0
      ? conditions.length > 1
        ? and(...conditions)
        : conditions[0]
      : undefined;

  const machineList = await db.query.machines.findMany({
    where: whereClause,
    orderBy: (machines, { asc }) => [asc(machines.name)],
    with: {
      location: true,
    },
  });

  // Get location list for filtering
  const locationList = await db.query.locations.findMany({
    orderBy: (locations, { asc }) => [asc(locations.name)],
  });

  // Count tickets per machine status
  const statusCounts = {
    operational: machineList.filter((m) => m.status === "operational").length,
    down: machineList.filter((m) => m.status === "down").length,
    maintenance: machineList.filter((m) => m.status === "maintenance").length,
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold shadow-sm">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
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
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Page header & Stats */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Machines
            </h1>
            <p className="text-slate-500 mt-1">
              Select a machine to report an issue
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
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
        <div className="py-2">
          <MachineSearch locations={locationList} initialSearch={search} />
        </div>

        {/* Machine grid */}
        <MachineGrid machines={machineList} />
      </main>
    </div>
  );
}

function StatusCard({
  label,
  count,
  status,
}: {
  label: string;
  count: number;
  status: "operational" | "down" | "maintenance";
}) {
  const config = {
    operational: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: CheckCircle2,
    },
    down: {
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: AlertTriangle,
    },
    maintenance: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: Wrench,
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-2 bg-white shadow-sm transition-all ${config.border}`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={`text-lg font-bold leading-none ${config.color}`}>
          {count}
        </p>
      </div>
    </div>
  );
}

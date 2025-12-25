import { db } from "@/db";
import { equipment, notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { and, eq, ilike, sql } from "drizzle-orm";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  MonitorCog,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentGrid } from "./(operator)/equipment-grid";
import { EquipmentSearch } from "./(operator)/equipment-search";
import { OperatorNav } from "./(operator)/nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-zinc-50/50 industrial-grid pb-20 lg:pb-0">
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
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-10 animate-in">
        {/* User Greeting Area */}
        <div className="flex items-center justify-between bg-primary-600 p-6 rounded-3xl text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-primary-100 text-sm font-medium mt-1">
              Carey Manufacturing Sdn Bhd
            </p>
          </div>
          <div className="relative z-10 h-12 w-12 rounded-full border-2 border-white/30 overflow-hidden bg-white/20 backdrop-blur-sm">
             {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        </div>

        {/* Quick Actions Grid */}
        <section>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: "Work Requests", icon: <AlertTriangle />, color: "bg-blue-50 text-blue-600", href: "/report" },
              { label: "Work Order", icon: <ClipboardList />, color: "bg-orange-50 text-orange-600", href: "/my-tickets" },
              { label: "PM", icon: <Wrench />, color: "bg-green-50 text-green-600", href: "/dashboard/maintenance" },
              { label: "Vendor", icon: <Users />, color: "bg-yellow-50 text-yellow-600", href: "/admin/users" },
              { label: "Equipment", icon: <MonitorCog />, color: "bg-purple-50 text-purple-600", href: "/admin/equipment" },
              { label: "Inventory", icon: <Package />, color: "bg-indigo-50 text-indigo-600", href: "/admin/inventory" },
              { label: "Work Permit", icon: <FileText />, color: "bg-red-50 text-red-600", href: "/admin/reports" },
              { label: "Legal", icon: <ShieldCheck />, color: "bg-sky-50 text-sky-600", href: "/" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
              >
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all", action.color)}>
                  {action.icon}
                </div>
                <span className="text-[10px] font-bold text-center leading-tight text-zinc-600">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Status Summaries */}
        <section className="space-y-6">
          <div>
            <h3 className="text-lg font-black tracking-tight text-zinc-800 uppercase flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary-500" />
              Work orders
            </h3>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 relative overflow-hidden group">
                <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">Open</p>
                <p className="text-3xl font-black text-red-700">{statusCounts.down}</p>
                <span className="text-[10px] text-red-500 font-bold ml-1">nos.</span>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full transition-transform group-hover:scale-150" />
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden group">
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Repairing</p>
                <p className="text-3xl font-black text-blue-700">{statusCounts.maintenance}</p>
                <span className="text-[10px] text-blue-500 font-bold ml-1">nos.</span>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-100 rounded-full transition-transform group-hover:scale-150" />
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 relative overflow-hidden group">
                <p className="text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                <p className="text-3xl font-black text-orange-700">{statusCounts.operational}</p>
                <span className="text-[10px] text-orange-500 font-bold ml-1">nos.</span>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-100 rounded-full transition-transform group-hover:scale-150" />
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-black tracking-tight text-zinc-800 uppercase flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-500" />
              Preventive Maintenance
            </h3>
             <div className="grid grid-cols-2 gap-4 mt-4">
               <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                  <p className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">Due soon</p>
                  <p className="text-3xl font-black text-primary-700">51</p>
                  <span className="text-[10px] text-primary-500 font-bold ml-1">nos.</span>
               </div>
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider mb-1">Closed</p>
                  <p className="text-3xl font-black text-zinc-700">3</p>
                  <span className="text-[10px] text-zinc-500 font-bold ml-1">nos.</span>
               </div>
             </div>
          </div>
        </section>

        {/* Equipment Search Section (Keep but optimize) */}
        <section className="pt-10 border-t">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Monitor Assets
            </h2>
            <Link href="/" className="text-sm font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">
              See All
            </Link>
          </div>
          <div className="bg-white/50 p-4 rounded-2xl border border-zinc-200 shadow-sm backdrop-blur-sm mb-6">
            <EquipmentSearch locations={locationList} initialSearch={search} />
          </div>
          <EquipmentGrid equipment={equipmentList} />
        </section>
      </main>
      <BottomNav role={user.role} />
    </div>
  );
}

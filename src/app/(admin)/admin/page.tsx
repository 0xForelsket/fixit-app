import { db } from "@/db";
import { equipment, users, workOrders } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { count, eq } from "drizzle-orm";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ClipboardList,
  MonitorCog,
  Package,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StatsCard } from "@/components/dashboard/stats-card";

// ...

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user.permissions, PERMISSIONS.ALL)) {
    redirect("/");
  }

  // Fetch System Stats
  const userCount = await db
    .select({ count: count() })
    .from(users)
    .then((res) => res[0].count);
  const equipmentCount = await db
    .select({ count: count() })
    .from(equipment)
    .then((res) => res[0].count);
  const openWorkOrders = await db
    .select({ count: count() })
    .from(workOrders)
    .where(eq(workOrders.status, "open"))
    .then((res) => res[0].count);

  const downEquipment = await db
    .select({ count: count() })
    .from(equipment)
    .where(eq(equipment.status, "down"))
    .then((res) => res[0].count);

  const quickLinks = [
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Manage system access and roles",
    },
    {
      title: "Equipment Inventory",
      icon: MonitorCog,
      href: "/admin/equipment",
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Asset tracking and history",
    },
    {
      title: "Maintenance Schedules",
      icon: Calendar,
      href: "/admin/schedules",
      color: "text-orange-600",
      bg: "bg-orange-50",
      description: "PM planning and calendars",
    },
    {
      title: "QR Codes",
      icon: QrCode,
      href: "/admin/qr-codes",
      color: "text-zinc-600",
      bg: "bg-zinc-100",
      description: "Generate asset tags",
    },
    {
      title: "Global Reports",
      icon: BarChart3,
      href: "/admin/reports",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "Analytics and export data",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      color: "text-slate-600",
      bg: "bg-slate-100",
      description: "System configuration",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-zinc-500" />
          System Overview
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={userCount}
            icon={Users}
            color="text-blue-600"
            bg="bg-blue-100"
            href="/admin/users"
            variant="admin"
          />
          <StatsCard
            title="Equipment"
            value={equipmentCount}
            icon={MonitorCog}
            color="text-purple-600"
            bg="bg-purple-100"
            href="/admin/equipment"
            variant="admin"
          />
          <StatsCard
            title="Open WOs"
            value={openWorkOrders}
            icon={ClipboardList}
            color="text-red-600"
            bg="bg-red-100"
            href="/dashboard/work-orders?status=open"
            variant="admin"
          />
          <StatsCard
            title="Down Assets"
            value={downEquipment}
            icon={AlertTriangle}
            color="text-orange-600"
            bg="bg-orange-100"
            href="/admin/equipment?status=down"
            variant="admin"
          />
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-8">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-zinc-500" />
          Management Areas
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group relative flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 bg-white hover:border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
            >
              <div
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  link.bg
                )}
              >
                <link.icon className={cn("h-7 w-7", link.color)} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 group-hover:text-primary-600 transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

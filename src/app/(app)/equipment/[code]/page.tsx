import { BottomNav } from "@/components/layout/bottom-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import {
  equipment as equipmentTable,
  maintenanceSchedules,
  workOrders,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EquipmentHistory } from "./equipment-history";
import { EquipmentMaintenance } from "./equipment-maintenance";
import { EquipmentOverview } from "./equipment-overview";
import { EquipmentTabs } from "./equipment-tabs";
import { ReportForm } from "./report-form";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function EquipmentPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Explicit permission check (Operator has EQUIPMENT_VIEW)
  const canView =
    user.permissions.includes("equipment:view") ||
    user.permissions.includes("ticket:view_all") ||
    user.permissions.includes("*");

  if (!canView) {
    redirect("/");
  }

  const { code } = await params;

  // Find equipment by code
  const equipmentItem = await db.query.equipment.findFirst({
    where: eq(equipmentTable.code, code.toUpperCase()),
    with: {
      location: true,
      owner: {
        columns: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      parent: {
        columns: {
          id: true,
          name: true,
          code: true,
        },
      },
      children: {
        columns: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      },
    },
  });

  if (!equipmentItem) {
    notFound();
  }

  // Fetch work order history for this equipment
  const workOrderHistory = await db.query.workOrders.findMany({
    where: eq(workOrders.equipmentId, equipmentItem.id),
    orderBy: [desc(workOrders.createdAt)],
    limit: 10,
    columns: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  // Fetch maintenance schedules for this equipment
  const schedules = await db.query.maintenanceSchedules.findMany({
    where: eq(maintenanceSchedules.equipmentId, equipmentItem.id),
    orderBy: [maintenanceSchedules.nextDue],
  });

  // Count open work orders
  const openWorkOrderCount = workOrderHistory.filter(
    (wo) => wo.status === "open" || wo.status === "in_progress"
  ).length;

  // Check if any PM is due (within 7 days or overdue)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hasDuePM = schedules.some((s) => s.nextDue <= sevenDaysFromNow);

  return (
    <div className="min-h-screen bg-zinc-50/50 industrial-grid pb-24 lg:pb-8">
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Compact Navigation & Title Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-zinc-900 truncate">
                  {equipmentItem.name}
                </h1>
                <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
                  {equipmentItem.code}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <MapPin className="h-3 w-3" />
                {equipmentItem.location?.name || "No Location"}
              </div>
            </div>
          </div>

          <StatusBadge
            status={equipmentItem.status}
            showIcon
            className="h-8 px-3 text-[11px] font-black rounded-lg border-zinc-200/50"
          />
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <EquipmentTabs
          equipmentId={equipmentItem.id}
          overviewContent={
            <EquipmentOverview
              equipment={equipmentItem}
              hasDuePM={hasDuePM}
              openWorkOrderCount={openWorkOrderCount}
              permissions={user.permissions}
            />
          }
          historyContent={<EquipmentHistory workOrders={workOrderHistory} />}
          maintenanceContent={
            <EquipmentMaintenance
              schedules={schedules.map((s) => ({
                id: s.id,
                name: s.title,
                type: s.type,
                nextDueDate: s.nextDue,
                frequencyDays: s.frequencyDays,
                workOrderId: null,
              }))}
            />
          }
          reportContent={<ReportForm equipment={equipmentItem} />}
        />
      </div>

      <BottomNav permissions={user.permissions} />
    </div>
  );
}

import { BottomNav } from "@/components/layout/bottom-nav";
import { db } from "@/db";
import {
  equipment as equipmentTable,
  maintenanceSchedules,
  workOrders,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Factory,
  MapPin,
  User,
  Wrench,
} from "lucide-react";
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
      <div className="mx-auto max-w-3xl px-4 py-4 md:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-primary-600 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Link>
      </div>

      {/* Equipment Header Card */}
      <div className="mx-auto max-w-3xl px-4">
        <div className="overflow-hidden rounded-2xl border-2 bg-white shadow-sm">
          <div
            className={cn(
              "h-2 w-full",
              equipmentItem.status === "operational" && "bg-success-500",
              equipmentItem.status === "down" && "bg-danger-500",
              equipmentItem.status === "maintenance" && "bg-warning-500"
            )}
          />

          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 border-2 border-zinc-200">
                  <Factory className="h-8 w-8 text-zinc-400" />
                </div>

                <div className="space-y-1">
                  <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900">
                      {equipmentItem.name}
                    </h1>
                    <p className="font-mono text-xs md:text-sm font-bold text-zinc-500 mt-0.5">
                      #{equipmentItem.code}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-zinc-500 font-medium">
                    {equipmentItem.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {equipmentItem.location.name}
                      </div>
                    )}

                    {equipmentItem.owner && (
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        {equipmentItem.owner.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <EquipmentStatusBadge status={equipmentItem.status} />
            </div>
          </div>
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

function EquipmentStatusBadge({
  status,
}: {
  status: "operational" | "down" | "maintenance";
}) {
  const config = {
    operational: {
      bg: "bg-success-100",
      text: "text-success-800",
      border: "border-success-200",
      icon: CheckCircle2,
      label: "Operational",
    },
    down: {
      bg: "bg-danger-100",
      text: "text-danger-800",
      border: "border-danger-200",
      icon: AlertTriangle,
      label: "Line Down",
    },
    maintenance: {
      bg: "bg-warning-100",
      text: "text-warning-800",
      border: "border-warning-200",
      icon: Wrench,
      label: "Maintenance",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 shadow-sm",
        config.bg,
        config.border
      )}
    >
      <Icon className={cn("h-5 w-5", config.text)} />
      <span className={cn("font-bold uppercase tracking-wide", config.text)}>
        {config.label}
      </span>
    </div>
  );
}

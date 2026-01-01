import { BottomNav } from "@/components/layout/bottom-nav";
import {
  EntityDetailItem,
  EntityDetailLayout,
  EntityGrid,
  EntityHeader,
  EntityStatusCard,
} from "@/components/layout/entity-detail";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import {
  equipment as equipmentTable,
  maintenanceSchedules,
  workOrders,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, MapPin, Wrench } from "lucide-react";
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
      displayId: true,
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

  const statusColorMap: Record<
    string,
    "zinc" | "blue" | "emerald" | "amber" | "red"
  > = {
    operational: "emerald",
    maintenance: "amber",
    down: "red",
  };
  const statusColor = statusColorMap[equipmentItem.status] || "zinc";

  const StatusIcon =
    equipmentItem.status === "operational"
      ? CheckCircle2
      : equipmentItem.status === "maintenance"
        ? Wrench
        : AlertTriangle;

  return (
    <EntityDetailLayout>
      <EntityHeader
        title={equipmentItem.name}
        badge={equipmentItem.code}
        parentLink={{ href: "/assets/equipment", label: "Back to Equipment" }}
        breadcrumbs={[
          { label: "Equipment", href: "/assets/equipment" },
          ...(equipmentItem.parent
            ? [
                {
                  label: equipmentItem.parent.name,
                  href: `/equipment/${equipmentItem.parent.code}`,
                },
              ]
            : []),
          { label: equipmentItem.name },
        ]}
        meta={
          <>
            <MapPin className="h-3 w-3" />
            {equipmentItem.location?.name || "No Location"}
          </>
        }
        statusBadge={
          <StatusBadge
            status={equipmentItem.status}
            showIcon
            className="h-8 px-3 text-[11px] font-black rounded-lg border-zinc-200/50"
          />
        }
      />

      <EntityGrid
        sidebar={
          <div className="space-y-6">
            <EntityStatusCard
              status={equipmentItem.status}
              statusColor={statusColor}
              icon={StatusIcon}
              statusBadge={
                <StatusBadge
                  status={equipmentItem.status}
                  showIcon={false}
                  className="h-7 px-3 text-xs justify-center"
                />
              }
            >
              <EntityDetailItem label="Location">
                <div className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  {equipmentItem.location?.name || "Unassigned"}
                </div>
              </EntityDetailItem>

              {equipmentItem.parent && (
                <EntityDetailItem label="Parent Asset">
                  <Link
                    href={`/assets/equipment/${equipmentItem.parent.code}`}
                    className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 hover:border-primary-200 hover:bg-primary-50 transition-all"
                  >
                    <div className="h-6 w-6 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-primary-600">
                      <Wrench className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                        Parent
                      </div>
                      <div className="text-xs font-bold text-zinc-900 truncate group-hover:text-primary-700">
                        {equipmentItem.parent.name}
                      </div>
                    </div>
                  </Link>
                </EntityDetailItem>
              )}
            </EntityStatusCard>
          </div>
        }
        content={
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
        }
      />
      <BottomNav permissions={user.permissions} />
    </EntityDetailLayout>
  );
}

import { TimeLogger } from "@/components/time-logger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { WorkOrderAttachments } from "@/components/work-orders/work-order-attachments";
import { WorkOrderChecklist } from "@/components/work-orders/work-order-checklist";
import { WorkOrderPartsManager } from "@/components/work-orders/work-order-parts-manager";
import { db } from "@/db";
import {
  attachments,
  checklistCompletions,
  laborLogs,
  locations,
  spareParts,
  workOrderLogs,
  workOrderParts,
  workOrders,
} from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { formatRelativeTime, cn } from "@/lib/utils";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  MessageSquare,
  Wrench,
  AlertTriangle,
  History,
  Info,
  User,
  FileText,
  Settings,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileWorkOrderView } from "./mobile-work-order-view";
import { PrintWorkOrderButton } from "./print-work-order-button";
import { WorkOrderActions } from "./work-order-actions";
import { WorkOrderTabs } from "./work-order-tabs";
import {
  EntityDetailLayout,
  EntityHeader,
  EntityGrid,
  EntityStatusCard,
  EntityDetailItem,
} from "@/components/layout/entity-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const workOrderId = Number(id);

  if (Number.isNaN(workOrderId)) notFound();

  const workOrder = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, workOrderId),
    with: {
      equipment: {
        with: {
          location: true,
        },
      },
      reportedBy: true,
      assignedTo: true,
      logs: {
        with: {
          createdBy: true,
        },
        orderBy: desc(workOrderLogs.createdAt),
      },
    },
  });

  if (!workOrder) notFound();

  // Security Audit: Technicians only allowed to view work orders in their own department
  if (
    user.roleName === "tech" &&
    user.departmentId &&
    workOrder.departmentId &&
    user.departmentId !== workOrder.departmentId
  ) {
    notFound();
  }

  // Fetch checklist items
  const checklistItems = await db.query.checklistCompletions.findMany({
    where: eq(checklistCompletions.workOrderId, workOrderId),
    with: {
      checklist: true,
    },
    orderBy: asc(checklistCompletions.id),
  });

  // Fetch attachments
  const rawAttachments = await db.query.attachments.findMany({
    where: and(
      eq(attachments.entityType, "work_order"),
      eq(attachments.entityId, workOrderId)
    ),
  });

  // Generate presigned URLs
  const workOrderAttachments = await Promise.all(
    rawAttachments.map(async (att) => ({
      ...att,
      url: await getPresignedDownloadUrl(att.s3Key),
    }))
  );

  // Fetch all users for assignment dropdown and log resolution
  const allUsers = await db.query.users.findMany({
    with: {
      assignedRole: true,
    },
  });
  const techs = allUsers.filter((u) => u.isActive && u.assignedRole?.name === "tech");

  // Fetch labor logs for this work order
  const workOrderLaborLogs = await db.query.laborLogs.findMany({
    where: eq(laborLogs.workOrderId, workOrderId),
    with: {
      user: true,
    },
    orderBy: desc(laborLogs.createdAt),
  });

  // Fetch work order parts
  const consumedParts = await db.query.workOrderParts.findMany({
    where: eq(workOrderParts.workOrderId, workOrderId),
    with: {
      part: true,
      addedBy: true,
    },
    orderBy: desc(workOrderParts.addedAt),
  });

  // Fetch all parts and locations for the manager
  const allParts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    columns: { id: true, name: true, sku: true },
  });

  const activeLocations = await db.query.locations.findMany({
    where: eq(locations.isActive, true),
    columns: { id: true, name: true },
  });

  // Map priorities to StatusBadge compatible values
  const priority = workOrder.priority as string;

  // Create User Map for Activity Log Resolution
  const userMap = new Map(
    allUsers.map((u) => [u.id.toString(), `${u.name} (${u.employeeId})`])
  );

  const formatLogValue = (action: string, value: string | null) => {
    if (!value) return "none";
    if (action === "assignment") {
      return userMap.get(value) || `User #${value}`;
    }
    return value;
  };

  // --- Tab Content ---
  const OverviewContent = (
    <div className="space-y-6">
      {workOrder.resolutionNotes && (
        <div className="rounded-xl border border-success-200 bg-success-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-success-700 mb-3 font-black uppercase tracking-wider text-[10px]">
            <CheckCircle2 className="h-4 w-4" />
            Resolution Notes
          </div>
          <p className="text-success-900/80 whitespace-pre-wrap leading-relaxed text-sm">
            {workOrder.resolutionNotes}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-zinc-400">
          <Info className="h-3 w-3" />
          Problem Description
        </div>
        <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
          {workOrder.description}
        </p>
      </div>

      <div className="pt-4 border-t border-zinc-100">
        <WorkOrderAttachments attachments={workOrderAttachments} />
      </div>
    </div>
  );

  const ProcedureContent = checklistItems.length > 0 ? (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-zinc-400">
        <ClipboardCheck className="h-3 w-3" />
        Maintenance Checklist
      </div>
      <WorkOrderChecklist workOrderId={workOrderId} items={checklistItems} />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border-2 border-zinc-200">
        <ClipboardCheck className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-black text-zinc-900">No Procedure</h3>
      <p className="mt-1 text-sm text-zinc-500 max-w-xs">
        No maintenance checklist has been defined for this work order.
      </p>
    </div>
  );

  const ActivityContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-zinc-400">
        <MessageSquare className="h-3 w-3" />
        Activity Log
      </div>
      {workOrder.logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border-2 border-zinc-200">
            <History className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-black text-zinc-900">No Activity</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-xs">
            No activity has been recorded for this work order yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {workOrder.logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-zinc-200 bg-white p-3 flex gap-3 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="shrink-0">
                {log.action === "comment" ? (
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                    <Clock className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-zinc-900 truncate">
                    {log.createdBy.name}
                  </span>
                  <span
                    className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
                {log.action === "comment" ? (
                  <div className="text-sm text-zinc-700 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    {log.newValue}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">
                    Changed <strong>{log.action.replace("_", " ")}</strong> from{" "}
                    <span className="line-through opacity-70">
                      {formatLogValue(log.action, log.oldValue)}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-zinc-900">
                      {formatLogValue(log.action, log.newValue)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ResourcesContent = (
    <div className="space-y-6">
      <TimeLogger
        workOrderId={workOrder.id}
        userId={user.id}
        userHourlyRate={user.hourlyRate}
        existingLogs={workOrderLaborLogs}
      />
      <div className="pt-4 border-t border-zinc-100">
        <WorkOrderPartsManager
          workOrderId={workOrder.id}
          parts={consumedParts}
          allParts={allParts}
          locations={activeLocations}
        />
      </div>
    </div>
  );

  // Status mapping for EntityStatusCard
  const statusColorMap: Record<string, "zinc" | "blue" | "emerald" | "amber" | "red"> = {
    open: "zinc",
    in_progress: "blue",
    completed: "emerald",
    on_hold: "amber",
    cancelled: "red",
  };
  const statusColor = statusColorMap[workOrder.status] || "zinc";
  
  const StatusIcon = 
    workOrder.status === "in_progress" ? Clock :
    workOrder.status === "completed" ? CheckCircle2 :
    AlertTriangle;

  return (
    <EntityDetailLayout>
      <EntityHeader
        title={workOrder.title}
        badge={`#${workOrder.id}`}
        parentLink={{ href: "/maintenance/work-orders", label: "Back" }}
        meta={
          <>
            <User className="h-3 w-3" />
            Reported by {workOrder.reportedBy.name} •{" "}
            <span suppressHydrationWarning>
              {formatRelativeTime(workOrder.createdAt)}
            </span>
          </>
        }
        actions={<PrintWorkOrderButton />}
        statusBadge={
          <StatusBadge
            status={workOrder.status}
            showIcon
            className="h-8 px-3 text-[11px] font-black rounded-lg border-zinc-200/50"
          />
        }
      />

      <EntityGrid
        sidebar={
          <div className="space-y-6">
            <EntityStatusCard
              statusColor={statusColor}
              icon={StatusIcon}
              statusBadge={
                <StatusBadge
                  status={workOrder.status}
                  showIcon={false}
                  className="h-7 px-3 text-xs justify-center"
                />
              }
            >
              <EntityDetailItem label="Priority">
                <StatusBadge status={priority} className="h-6 text-[10px]" />
              </EntityDetailItem>

              <EntityDetailItem label="Assignee">
                <div className="flex items-center gap-2">
                  {workOrder.assignedTo ? (
                    <>
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                        {workOrder.assignedTo.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-zinc-900 truncate max-w-[100px]">
                        {workOrder.assignedTo.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-zinc-400 italic">
                      Unassigned
                    </span>
                  )}
                </div>
              </EntityDetailItem>

              <EntityDetailItem label="Equipment">
              <Link
                href={`/assets/equipment/${workOrder.equipment.code}`}
                className="flex items-center gap-3 group rounded-lg border border-zinc-100 p-2 hover:border-primary-200 hover:bg-primary-50/50 transition-all bg-zinc-50/50"
              >
                <div className="h-8 w-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Wrench className="h-4 w-4 text-zinc-500 group-hover:text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-zinc-900 truncate group-hover:text-primary-700 transition-colors">
                    {workOrder.equipment.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[9px] font-bold text-zinc-400">
                      {workOrder.equipment.code}
                    </span>
                    {workOrder.equipment.location && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider truncate">
                          {workOrder.equipment.location.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
              </EntityDetailItem>

              <EntityDetailItem label="Timeline">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">Created</span>
                    <span
                      className="font-mono font-bold text-zinc-700"
                      suppressHydrationWarning
                    >
                      {new Date(workOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {workOrder.dueBy && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">Due Date</span>
                      <span
                        className="font-mono font-bold text-danger-600"
                        suppressHydrationWarning
                      >
                        {new Date(workOrder.dueBy).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </EntityDetailItem>
            </EntityStatusCard>

            <div className="space-y-2">
              <WorkOrderActions
                workOrder={workOrder}
                currentUser={{ id: user.id, name: user.name }}
                allTechs={techs}
              />
            </div>
          </div>
        }
        content={
          <WorkOrderTabs
            workOrderId={workOrder.id}
            overviewContent={OverviewContent}
            procedureContent={ProcedureContent}
            activityContent={ActivityContent}
            resourcesContent={ResourcesContent}
          />
        }
      />

       <div className="lg:hidden">
        <MobileWorkOrderView
          infoTab={
            <div className="space-y-6">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-2">
                <InfoCard label="Status" compact>
                  <StatusBadge status={workOrder.status} showIcon className="font-black text-xs" />
                </InfoCard>
                <InfoCard label="Priority" compact>
                  <StatusBadge status={priority} className="font-black text-xs" />
                </InfoCard>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-zinc-400">
                  <Info className="h-3 w-3" />
                  Description
                </div>
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {workOrder.description}
                </p>
              </div>

              {/* Equipment Link */}
              <Link
                href={`/assets/equipment/${workOrder.equipment.code}`}
                className="block"
              >
                <InfoCard label="Equipment" className="hover:border-primary-300">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                      <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-zinc-900 truncate">
                        {workOrder.equipment.name}
                      </p>
                      <span className="font-mono text-[9px] font-bold text-zinc-400">
                        {workOrder.equipment.code}
                      </span>
                    </div>
                  </div>
                </InfoCard>
              </Link>

              <WorkOrderAttachments attachments={workOrderAttachments} />
            </div>
          }
          checklistTab={<div className="pt-2">{ProcedureContent}</div>}
          commentsTab={ActivityContent}
          inventoryTab={
            <div className="space-y-6">
              <WorkOrderPartsManager
                workOrderId={workOrder.id}
                parts={consumedParts}
                allParts={allParts}
                locations={activeLocations}
              />
            </div>
          }
          logsTab={
            <div className="space-y-6">
              <TimeLogger
                workOrderId={workOrder.id}
                userId={user.id}
                userHourlyRate={user.hourlyRate}
                existingLogs={workOrderLaborLogs}
              />
            </div>
          }
          actions={
            <div className="flex gap-2 w-full">
              <Button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 rounded-xl">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Update Status
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-bold h-12 rounded-xl border-2"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Add Comment
              </Button>
            </div>
          }
        />
      </div>
    </EntityDetailLayout>
  );
}

// Reusable Info Card Component - matches equipment page styling
function InfoCard({
  label,
  children,
  className,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      <div className={cn("px-3", compact ? "py-2" : "py-3")}>
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

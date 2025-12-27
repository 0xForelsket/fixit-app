import { WorkOrderChecklist } from "@/components/work-orders/work-order-checklist";
import { WorkOrderPartsManager } from "@/components/work-orders/work-order-parts-manager";
import { TimeLogger } from "@/components/time-logger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import {
  attachments,
  checklistCompletions,
  laborLogs,
  locations,
  spareParts,
  workOrderParts,
  workOrders,
  users,
} from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileWorkOrderView } from "./mobile-work-order-view";
import { WorkOrderActions } from "./work-order-actions";

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
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      },
    },
  });

  if (!workOrder) notFound();

  // Fetch checklist items
  const checklistItems = await db.query.checklistCompletions.findMany({
    where: eq(checklistCompletions.workOrderId, workOrderId),
    with: {
      checklist: true,
    },
    orderBy: (items, { asc }) => [asc(items.id)],
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

  // Fetch all techs for assignment dropdown
  const allUsers = await db.query.users.findMany({
    where: eq(users.isActive, true),
    with: {
      assignedRole: true,
    },
  });
  const techs = allUsers.filter((u) => u.assignedRole?.name === "tech");

  // Fetch labor logs for this work order
  const workOrderLaborLogs = await db.query.laborLogs.findMany({
    where: eq(laborLogs.workOrderId, workOrderId),
    with: {
      user: true,
    },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
  });

  // Fetch work order parts
  const consumedParts = await db.query.workOrderParts.findMany({
    where: eq(workOrderParts.workOrderId, workOrderId),
    with: {
      part: true,
      addedBy: true,
    },
    orderBy: (tp, { desc }) => [desc(tp.addedAt)],
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

  // Status Configuration
  const statusConfig = {
    open: {
      label: "Open",
      icon: AlertTriangle,
      color: "text-primary-700",
      bg: "bg-primary-50",
      border: "border-primary-200",
    },
    in_progress: {
      label: "In Progress",
      icon: Wrench,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    resolved: {
      label: "Resolved",
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    closed: {
      label: "Closed",
      icon: CheckCircle2,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  }[workOrder.status];

  const priorityConfig = {
    low: { color: "bg-slate-500", label: "Low" },
    medium: { color: "bg-primary-500", label: "Medium" },
    high: { color: "bg-amber-500", label: "High" },
    critical: { color: "bg-rose-600", label: "Critical" },
  }[workOrder.priority];

  const StatusIcon = statusConfig.icon;

  const DetailHeader = (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div
        className={cn(
          "flex items-center justify-between border-b px-6 py-4",
          statusConfig.bg,
          statusConfig.border
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm",
              statusConfig.color
            )}
          >
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-wider opacity-70",
                statusConfig.color
              )}
            >
              Status
            </p>
            <p
              className={cn(
                "text-lg font-bold leading-none",
                statusConfig.color
              )}
            >
              {statusConfig.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Priority
            </p>
            <div className="flex items-center gap-2 justify-end">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", priorityConfig.color)}
              />
              <span className="font-bold text-foreground">
                {priorityConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              #{workOrder.id}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Reported {formatRelativeTime(workOrder.createdAt)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {workOrder.title}
          </h1>
        </div>
      </div>
    </div>
  );

  const DescriptionSection = (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Description</h2>
      <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
        {workOrder.description}
      </p>
    </div>
  );

  const AttachmentsSection = workOrderAttachments.length > 0 && (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Attachments</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {workOrderAttachments.map((file) => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col overflow-hidden rounded-lg border bg-slate-50 transition-all hover:border-primary-300 hover:shadow-md"
          >
            {file.mimeType.startsWith("image/") ? (
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                <img
                  src={file.url}
                  alt={file.filename}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400">
                <FileText className="h-10 w-10" />
              </div>
            )}
            <div className="flex items-center justify-between p-3">
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-medium text-foreground">
                  {file.filename}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {(file.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary-600" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );

  const ProcedureSection = checklistItems.length > 0 && (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <ClipboardCheck className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-bold">Maintenance Procedure</h2>
      </div>
      <WorkOrderChecklist workOrderId={workOrderId} items={checklistItems} />
    </div>
  );

  const ActivityLogSection = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-bold">Activity Log</h2>
      </div>
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        {workOrder.logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          workOrder.logs.map((log) => (
            <div key={log.id} className="p-4 flex gap-4">
              <div className="mt-1">
                {log.action === "comment" ? (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Clock className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{log.createdBy.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
                {log.action === "comment" ? (
                  <p className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border">
                    {log.newValue}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Changed <strong>{log.action.replace("_", " ")}</strong> from{" "}
                    <span className="line-through opacity-70">
                      {log.oldValue || "none"}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-foreground">
                      {log.newValue}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const EquipmentInfoSection = (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Equipment
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-foreground">
              {workOrder.equipment.name}
            </p>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {workOrder.equipment.code}
            </Badge>
          </div>
        </div>
        {workOrder.equipment.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {workOrder.equipment.location.name}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 lg:pb-12">
      {/* Navigation - Desktop Only */}
      <div className="hidden lg:flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block space-y-6">
        {DetailHeader}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {DescriptionSection}
            {ProcedureSection}
            {AttachmentsSection}
            {workOrder.resolutionNotes && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <h2 className="font-bold">Resolution Notes</h2>
                </div>
                <p className="text-emerald-900/80 whitespace-pre-wrap">
                  {workOrder.resolutionNotes}
                </p>
              </div>
            )}
            {ActivityLogSection}
          </div>
          <div className="space-y-6">
            <WorkOrderActions
              workOrder={workOrder}
              currentUser={{ id: user.id, name: user.name }}
              allTechs={techs}
            />
            {EquipmentInfoSection}
            <TimeLogger
              workOrderId={workOrder.id}
              userId={user.id}
              userHourlyRate={user.hourlyRate}
              existingLogs={workOrderLaborLogs}
            />
            <WorkOrderPartsManager
              workOrderId={workOrder.id}
              parts={consumedParts}
              allParts={allParts}
              locations={activeLocations}
            />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <MobileWorkOrderView
        infoTab={
          <div className="space-y-6">
            {DetailHeader}
            {DescriptionSection}
            {EquipmentInfoSection}
            {AttachmentsSection}
          </div>
        }
        checklistTab={
          <div className="space-y-6 pt-2">
            {ProcedureSection}
          </div>
        }
        commentsTab={ActivityLogSection}
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
          <>
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
          </>
        }
      />
    </div>
  );
}

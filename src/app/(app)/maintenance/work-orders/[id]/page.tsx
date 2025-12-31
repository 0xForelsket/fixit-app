import { TimeLogger } from "@/components/time-logger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
  users,
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
  CircleDashed,
  Hammer,
  AlertCircle,
  History,
  Info,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileWorkOrderView } from "./mobile-work-order-view";
import { PrintWorkOrderButton } from "./print-work-order-button";
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
      // location: true, // If we need location details
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

  // Map priorities to StatusBadge compatible values or handle manually if needed
  // StatusBadge handles "critical", "high", "medium", "low" mapped to variants
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

  const DescriptionSection = (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {workOrder.description}
        </p>
      </CardContent>
    </Card>
  );

  const AttachmentsSection = (
    <WorkOrderAttachments attachments={workOrderAttachments} />
  );

  const ProcedureSection = checklistItems.length > 0 && (
    <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <ClipboardCheck className="h-5 w-5 text-primary-600" />
            <CardTitle>Maintenance Procedure</CardTitle>
        </CardHeader>
        <CardContent>
             <WorkOrderChecklist workOrderId={workOrderId} items={checklistItems} />
        </CardContent>
    </Card>
  );

  const ActivityLogSection = (
     <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y relative">
            {/* Timeline connector line could be added here for extra polish */}
          {workOrder.logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No activity yet.
            </div>
          ) : (
            workOrder.logs.map((log) => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="mt-1 shrink-0">
                  {log.action === "comment" ? (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 ring-4 ring-white">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 ring-4 ring-white">
                      <Clock className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{log.createdBy.name}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  {log.action === "comment" ? (
                    <div className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border">
                      {log.newValue}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground break-words">
                      Changed <strong>{log.action.replace("_", " ")}</strong> from{" "}
                      <span className="line-through opacity-70">
                        {formatLogValue(log.action, log.oldValue)}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-foreground">
                        {formatLogValue(log.action, log.newValue)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EquipmentInfoSection = (
    <Card className="overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b">
        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-muted-foreground">
          Equipment
        </h3>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground truncate">
              {workOrder.equipment.name}
            </p>
            <Badge variant="secondary" className="font-mono text-[10px] mt-1">
              {workOrder.equipment.code}
            </Badge>
          </div>
        </div>
        {workOrder.equipment.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{workOrder.equipment.location.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Custom Status Config for the "Big Icon" look
  const statusConfigs: Record<
      string,
      { icon: React.ElementType; color: string; bg: string; label: string }
  > = {
      open: {
          icon: CircleDashed,
          color: "text-blue-700",
          bg: "bg-blue-50 border-blue-200",
          label: "Open",
      },
      in_progress: {
          icon: Hammer,
          color: "text-amber-700",
          bg: "bg-amber-50 border-amber-200",
          label: "In Progress",
      },
      completed: {
          icon: CheckCircle2,
          color: "text-emerald-700",
          bg: "bg-emerald-50 border-emerald-200",
          label: "Completed",
      },
      cancelled: {
          icon: AlertCircle,
          color: "text-slate-700",
          bg: "bg-slate-50 border-slate-200",
          label: "Cancelled",
      },
      on_hold: {
          icon: Clock,
          color: "text-orange-700",
          bg: "bg-orange-50 border-orange-200",
          label: "On Hold",
      },
  };

  const statusConfig = statusConfigs[workOrder.status] || statusConfigs.open;
  const StatusIcon = statusConfig.icon;

   const StatusSection = (
    <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex justify-center">
        <div
          className={cn(
            "inline-flex h-24 w-24 items-center justify-center rounded-full border-4",
            statusConfig.bg,
            statusConfig.color
          )}
        >
          <StatusIcon className="h-10 w-10" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={workOrder.status} />
        </div>
        <div className="flex justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Priority</span>
           <StatusBadge status={priority} />
        </div>
        <div className="flex justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Assignee</span>
          <span className="font-medium flex items-center gap-1">
             <User className="h-3 w-3" />
            {workOrder.assignedTo?.name || "Unassigned"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium flex items-center gap-1 align-right">
                <MapPin className="h-3 w-3" />
                {workOrder.equipment?.location?.name || "N/A"}
            </span>
        </div>
      </div>
    </Card>
  );

  return (
    <PageContainer>
        {/* Navigation - Desktop Only */}
        <div className="hidden lg:flex items-center justify-between print:hidden mb-6">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl border border-border bg-card transition-colors hover:bg-muted">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {workOrder.title}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
                         <span>#{workOrder.id}</span>
                         <span>•</span>
                         <span>Reported by {workOrder.reportedBy.name}</span>
                         <span>•</span>
                         <span suppressHydrationWarning>{formatRelativeTime(workOrder.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                 <PrintWorkOrderButton />
                 <WorkOrderActions
                    workOrder={workOrder}
                    currentUser={{ id: user.id, name: user.name }}
                    allTechs={techs}
               />
            </div>
        </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
           {StatusSection}
           {EquipmentInfoSection}

           <Card className="rounded-xl border border-border bg-card p-4 shadow-sm">
               <CardHeader className="p-0 pb-4">
                   <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Metrics</CardTitle>
               </CardHeader>
               <CardContent className="p-0 space-y-4">
                   <div>
                       <div className="text-xs text-muted-foreground mb-1">Created At</div>
                       <div className="font-mono text-sm" suppressHydrationWarning>{new Date(workOrder.createdAt).toLocaleString()}</div>
                   </div>
                   {workOrder.dueBy && (
                       <div>
                           <div className="text-xs text-muted-foreground mb-1">Due By</div>
                           <div className="font-mono text-sm" suppressHydrationWarning>{new Date(workOrder.dueBy).toLocaleString()}</div>
                       </div>
                   )}
               </CardContent>
           </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-8 space-y-6">
           <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="procedure" className="rounded-lg">Procedure</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg">Activity</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-lg">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6 focus-visible:outline-none">
                 {DescriptionSection}
                 {workOrder.resolutionNotes && (
                  <Card className="border-emerald-200 bg-emerald-50/50">
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 text-emerald-800 pb-2">
                           <CheckCircle2 className="h-5 w-5" />
                           <CardTitle>Resolution Notes</CardTitle>
                      </CardHeader>
                    <CardContent>
                        <p className="text-emerald-900/80 whitespace-pre-wrap">
                        {workOrder.resolutionNotes}
                        </p>
                    </CardContent>
                  </Card>
                )}
                 {AttachmentsSection}
            </TabsContent>

            <TabsContent value="procedure" className="mt-6 focus-visible:outline-none">
                {ProcedureSection || <div className="text-muted-foreground text-center py-8">No procedure checklist defined.</div>}
            </TabsContent>

            <TabsContent value="activity" className="mt-6 focus-visible:outline-none">
                {ActivityLogSection}
            </TabsContent>

            <TabsContent value="resources" className="space-y-6 mt-6 focus-visible:outline-none">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile View */}
      <MobileWorkOrderView
        infoTab={
          <div className="space-y-6">
            <div className="lg:hidden">
              {StatusSection}
            </div>
            {DescriptionSection}
            {EquipmentInfoSection}
            {AttachmentsSection}
          </div>
        }
        checklistTab={<div className="space-y-6 pt-2">{ProcedureSection}</div>}
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
    </PageContainer>
  );
}

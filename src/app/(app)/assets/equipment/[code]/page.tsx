import { isFavorite } from "@/actions/favorites";
import {
  getEquipmentAnomalies,
  getEquipmentPredictions,
} from "@/actions/predictions";
import { AuditLogList } from "@/components/audit/audit-log-list";
import {
  AnomalyAlerts,
  DowntimeLogList,
  PredictionsCard,
  RecordMeterReadingDialog,
  ReliabilityCard,
  ReportDowntimeDialog,
} from "@/components/equipment";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import {
  attachments,
  downtimeLogs,
  equipmentMeters,
  equipment as equipmentTable,
} from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  calculateDepreciation,
  formatCurrency,
  getDepreciationInfo,
  hasCompleteFinancialData,
} from "@/lib/utils/depreciation";
// Removed duplicate import
import { and, desc, eq } from "drizzle-orm";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  // Removed duplicate import
  Edit,
  FileText,
  Gauge,
  History,
  Info,
  MapPin,
  Package,
  Shield,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentsTab } from "../tabs/documents-tab";

async function getEquipmentItem(code: string) {
  return db.query.equipment.findFirst({
    where: eq(equipmentTable.code, code.toUpperCase()),
    with: {
      type: {
        with: {
          category: true,
        },
      },
      location: true,
      owner: true,
      responsibleDepartment: true,
      model: {
        with: {
          bom: {
            with: {
              part: {
                with: {
                  inventoryLevels: true,
                },
              },
            },
          },
        },
      },
      workOrders: {
        orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
        with: {
          assignedTo: true,
        },
        limit: 50,
      },
      maintenanceSchedules: true,
    },
  });
}

async function getEquipmentMeters(equipmentId: string) {
  return db.query.equipmentMeters.findMany({
    where: eq(equipmentMeters.equipmentId, equipmentId),
    orderBy: [desc(equipmentMeters.createdAt)],
  });
}

async function getDowntimeLogs(equipmentId: string) {
  return db.query.downtimeLogs.findMany({
    where: eq(downtimeLogs.equipmentId, equipmentId),
    orderBy: [desc(downtimeLogs.startTime)],
    limit: 10,
    with: {
      reportedBy: {
        columns: { name: true },
      },
    },
  });
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: equipmentCode } = await params;

  // Parallelize all initial data fetching
  const equipmentItem = await getEquipmentItem(equipmentCode);
  if (!equipmentItem) {
    notFound();
  }

  const [
    user,
    favoriteResult,
    meters,
    recentDowntime,
    attachmentsList,
    predictionsResult,
    anomaliesResult,
  ] = await Promise.all([
    getCurrentUser(),
    isFavorite("equipment", equipmentItem.id),
    getEquipmentMeters(equipmentItem.id),
    getDowntimeLogs(equipmentItem.id),
    db.query.attachments.findMany({
      where: and(
        eq(attachments.entityType, "equipment"),
        eq(attachments.entityId, equipmentItem.id)
      ),
      with: {
        uploadedBy: {
          columns: { name: true },
        },
      },
    }),
    getEquipmentPredictions(equipmentItem.id),
    getEquipmentAnomalies(equipmentItem.id),
  ]);

  const predictions =
    predictionsResult.success && predictionsResult.data
      ? predictionsResult.data
      : [];
  const anomalies =
    anomaliesResult.success && anomaliesResult.data ? anomaliesResult.data : [];

  // Generate signed URLs for attachments
  const attachmentsWithUrls = await Promise.all(
    attachmentsList.map(async (attachment) => ({
      ...attachment,
      url: await getPresignedDownloadUrl(attachment.s3Key),
    }))
  );

  // Check permissions
  const canViewFinancials = hasPermission(
    user?.permissions ?? [],
    PERMISSIONS.EQUIPMENT_FINANCIALS_VIEW
  );
  const canRecordMeters = hasPermission(
    user?.permissions ?? [],
    PERMISSIONS.EQUIPMENT_METERS_RECORD
  );
  const canReportDowntime = hasPermission(
    user?.permissions ?? [],
    PERMISSIONS.EQUIPMENT_DOWNTIME_REPORT
  );

  // Calculate depreciation if financial data is complete
  const depreciationInfo = getDepreciationInfo(equipmentItem);
  const depreciation = depreciationInfo
    ? calculateDepreciation(depreciationInfo)
    : null;

  // Security Audit: Technicians only allowed in their department
  if (
    user?.roleName === "tech" &&
    user.departmentId &&
    equipmentItem.departmentId &&
    user.departmentId !== equipmentItem.departmentId
  ) {
    notFound();
  }

  const isFavorited = favoriteResult.success && favoriteResult.data === true;

  const statusConfigs: Record<
    string,
    { icon: React.ElementType; color: string; bg: string; label: string }
  > = {
    operational: {
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      label: "Operational",
    },
    down: {
      icon: AlertCircle,
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
      label: "Down",
    },
    maintenance: {
      icon: Wrench,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      label: "Maintenance",
    },
  };

  const statusConfig =
    statusConfigs[equipmentItem.status] || statusConfigs.operational;
  const StatusIcon = statusConfig.icon;

  const _OverviewHeader = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {equipmentItem.name}
          </h1>
          <p className="text-muted-foreground font-mono">
            {equipmentItem.code}
          </p>
        </div>
      </div>
      {hasPermission(user?.permissions ?? [], PERMISSIONS.EQUIPMENT_UPDATE) && (
        <Button
          variant="outline"
          asChild
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold"
        >
          <Link href={`/assets/equipment/${equipmentItem.code}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            EDIT EQUIPMENT
          </Link>
        </Button>
      )}
    </div>
  );

  // Reliability Logic
  const periodDays = 365;
  const now = new Date();
  // Filter downtime to last 365 days
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000
  );
  const relevantDowntime = recentDowntime.filter(
    (log) => log.startTime >= periodStart
  );

  const totalPossibleHours = periodDays * 24;
  const totalDowntimeMs = relevantDowntime.reduce((acc, log) => {
    const end = log.endTime || new Date();
    return acc + (end.getTime() - log.startTime.getTime());
  }, 0);
  const totalDowntimeHours = totalDowntimeMs / (1000 * 60 * 60);

  const numberOfFailures = relevantDowntime.length;
  // MTBF = (Total Operating Time) / Number of Failures
  // Total Operating Time = Total Possible Time - Total Downtime
  const totalOperatingTime = totalPossibleHours - totalDowntimeHours;
  const mtbf =
    numberOfFailures > 0
      ? totalOperatingTime / numberOfFailures
      : totalOperatingTime;

  // MTTR = Total Downtime / Number of Failures
  const mttr = numberOfFailures > 0 ? totalDowntimeHours / numberOfFailures : 0;

  // Availability = (Operating Time / Total Time) * 100
  const availability = (totalOperatingTime / totalPossibleHours) * 100;

  const ReliabilitySection = (
    <div className="mb-6">
      <ReliabilityCard
        metrics={{
          mtbf,
          mttr,
          availability,
          totalDowntime: totalDowntimeHours,
          periodDays,
        }}
      />
    </div>
  );

  const HealthSection = (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Maintenance Health
      </h3>
      <div className="space-y-4">
        {(() => {
          const maintenanceWorkOrders = equipmentItem.workOrders.filter(
            (wo) => wo.type === "maintenance" || wo.type === "calibration"
          );
          const resolved = maintenanceWorkOrders.filter(
            (wo) => wo.status === "resolved" || wo.status === "closed"
          );
          const totalResolved = resolved.length;
          const onTime = resolved.filter((wo) => {
            if (!wo.dueBy || !wo.resolvedAt) return true;
            return wo.resolvedAt <= wo.dueBy;
          }).length;
          const rate =
            totalResolved > 0
              ? Math.round((onTime / totalResolved) * 100)
              : 100;

          return (
            <>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{rate}%</span>
                <span className="text-xs text-muted-foreground mb-1">
                  On-Time Rate
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    rate >= 90
                      ? "bg-emerald-500"
                      : rate >= 70
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  )}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-medium text-lg">{totalResolved}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total WOs</p>
                  <p className="font-medium text-lg">
                    {maintenanceWorkOrders.length}
                  </p>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  const StatusSection = (
    <div className="rounded-xl border border-border bg-card p-6">
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
          <span className={cn("font-medium", statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Location</span>
          <span className="font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {equipmentItem.location.name}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Owner</span>
          <span className="font-medium">
            {equipmentItem.owner?.name || "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );

  const HistorySection = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Work Orders
        </h3>
      </div>
      {equipmentItem.workOrders.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No work orders found.
        </div>
      ) : (
        <div className="divide-y">
          {equipmentItem.workOrders.slice(0, 10).map((workOrder, index) => {
            const staggerClass =
              index < 5
                ? `animate-stagger-${index + 1}`
                : "animate-in fade-in duration-500";
            return (
              <Link
                key={workOrder.id}
                href={`/maintenance/work-orders/${workOrder.id}`}
                className={cn(
                  "block p-4 hover:bg-muted transition-colors animate-in fade-in slide-in-from-bottom-1",
                  staggerClass
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate pr-2">
                    {workOrder.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase shrink-0">
                    {formatRelativeTime(workOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <StatusBadge status={workOrder.status} className="text-xs" />
                  <span className="text-muted-foreground italic">
                    {workOrder.assignedTo?.name || "Unassigned"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  // Specifications Section
  const SpecificationsSection = (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        Specifications
      </h3>
      <div className="space-y-3">
        {equipmentItem.serialNumber && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Serial Number</span>
            <span className="font-mono font-medium">
              {equipmentItem.serialNumber}
            </span>
          </div>
        )}
        {equipmentItem.manufacturer && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Manufacturer</span>
            <span className="font-medium">{equipmentItem.manufacturer}</span>
          </div>
        )}
        {equipmentItem.modelYear && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Model Year</span>
            <span className="font-medium">{equipmentItem.modelYear}</span>
          </div>
        )}
        {equipmentItem.warrantyExpiration && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Warranty Expires</span>
            <span
              className={cn(
                "font-medium flex items-center gap-1",
                equipmentItem.warrantyExpiration < new Date()
                  ? "text-rose-600"
                  : "text-emerald-600"
              )}
            >
              <Shield className="h-3 w-3" />
              {equipmentItem.warrantyExpiration.toLocaleDateString()}
            </span>
          </div>
        )}
        {!equipmentItem.serialNumber &&
          !equipmentItem.manufacturer &&
          !equipmentItem.modelYear &&
          !equipmentItem.warrantyExpiration && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No specifications recorded
            </p>
          )}
      </div>
    </div>
  );

  // Financials Section (permission protected)
  const FinancialsSection = canViewFinancials ? (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        Financial Information
      </h3>
      {hasCompleteFinancialData(equipmentItem) && depreciation ? (
        <div className="space-y-4">
          {/* Book Value Highlight */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Current Book Value
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(depreciation.bookValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {depreciation.percentDepreciated}% depreciated
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Purchase Price</p>
              <p className="font-medium">
                {formatCurrency(
                  Number.parseFloat(equipmentItem.purchasePrice!)
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Residual Value</p>
              <p className="font-medium">
                {formatCurrency(
                  Number.parseFloat(equipmentItem.residualValue || "0")
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Purchase Date</p>
              <p className="font-medium">
                {equipmentItem.purchaseDate?.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Useful Life</p>
              <p className="font-medium">
                {equipmentItem.usefulLifeYears} years
              </p>
            </div>
          </div>

          <div className="pt-2 border-t text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Depreciation</span>
              <span className="font-medium">
                {formatCurrency(depreciation.annualDepreciation)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Months Remaining</span>
              <span
                className={cn(
                  "font-medium",
                  depreciation.isFullyDepreciated
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {depreciation.isFullyDepreciated
                  ? "Fully depreciated"
                  : `${depreciation.monthsRemaining} months`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          No financial data recorded
        </p>
      )}
    </div>
  ) : null;

  // Meters Section
  const MetersSection = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Meters
        </h3>
        {/* Record Reading buttons are now per-meter below */}
      </div>
      {meters.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No meters configured
        </div>
      ) : (
        <div className="divide-y">
          {meters.map((meter) => (
            <div key={meter.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{meter.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {meter.type}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-bold text-lg">
                    {meter.currentReading || "—"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {meter.unit}
                    </span>
                  </p>
                  {meter.lastReadingDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(meter.lastReadingDate)}
                    </p>
                  )}
                  {canRecordMeters && (
                    <RecordMeterReadingDialog
                      meterId={meter.id}
                      meterName={meter.name}
                      unit={meter.unit}
                      currentReading={meter.currentReading}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Downtime Section

  const DowntimeSection = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Downtime History
        </h3>
        {canReportDowntime && (
          <ReportDowntimeDialog equipmentId={equipmentItem.id} />
        )}
      </div>
      <DowntimeLogList
        logs={recentDowntime}
        canReportDowntime={canReportDowntime}
      />
    </div>
  );

  const DocumentsSection = (
    <div className="rounded-xl border border-border bg-card p-6">
      <DocumentsTab
        equipmentId={equipmentItem.id}
        attachments={attachmentsWithUrls}
        userPermissions={user?.permissions ?? []}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/assets/equipment"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {equipmentItem.name}
            </h1>
            <p className="text-muted-foreground font-mono">
              {equipmentItem.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            entityType="equipment"
            entityId={equipmentItem.id}
            isFavorited={isFavorited}
          />
          {hasPermission(
            user?.permissions ?? [],
            PERMISSIONS.EQUIPMENT_UPDATE
          ) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/assets/equipment/${equipmentItem.code}/edit`}>
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <AnomalyAlerts anomalies={anomalies} />

      <div className="space-y-6 lg:hidden">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bom">
              <Package className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="schedules">
              <Calendar className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <PredictionsCard predictions={predictions} />
            {StatusSection}
            {ReliabilitySection}
            {SpecificationsSection}
            {FinancialsSection}
            {MetersSection}
            {HealthSection}
            {DowntimeSection}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {HistorySection}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {DocumentsSection}
          </TabsContent>

          <TabsContent value="bom" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Recommended Spares
              </h3>
              {/* Simplified BOM for mobile */}
              <div className="space-y-3">
                {equipmentItem.model?.bom.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 bg-muted rounded-lg border border-border animate-in fade-in slide-in-from-bottom-1",
                      index < 5
                        ? `animate-stagger-${index + 1}`
                        : "animate-in fade-in duration-500"
                    )}
                  >
                    <div className="flex justify-between font-bold text-sm">
                      <span>{item.part.name}</span>
                      <span className="text-primary-600">{item.part.sku}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Need: {item.quantityRequired}</span>
                      <span
                        className={cn(
                          "font-bold",
                          item.part.inventoryLevels.reduce(
                            (a, b) => a + b.quantity,
                            0
                          ) < 1
                            ? "text-red-500"
                            : "text-emerald-500"
                        )}
                      >
                        Stock:{" "}
                        {item.part.inventoryLevels.reduce(
                          (a, b) => a + b.quantity,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {(!equipmentItem.model ||
                  equipmentItem.model.bom.length === 0) && (
                  <p className="text-center text-muted-foreground text-sm">
                    No BOM defined.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedules" className="mt-6">
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {equipmentItem.maintenanceSchedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  className={cn(
                    "p-4 animate-in fade-in slide-in-from-bottom-1",
                    index < 5
                      ? `animate-stagger-${index + 1}`
                      : "animate-in fade-in duration-500"
                  )}
                >
                  <p className="font-bold text-sm">{schedule.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase">
                    {schedule.type} • Every {schedule.frequencyDays}d
                  </p>
                  <p
                    className={cn(
                      "text-xs font-bold mt-2",
                      schedule.nextDue && schedule.nextDue < new Date()
                        ? "text-red-600"
                        : "text-emerald-600"
                    )}
                  >
                    Next: {schedule.nextDue ? formatRelativeTime(schedule.nextDue) : "Not set"}
                  </p>
                </div>
              ))}
              {equipmentItem.maintenanceSchedules.length === 0 && (
                <p className="p-8 text-center text-muted-foreground text-sm">
                  No schedules.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <AuditLogList entityType="equipment" entityId={equipmentItem.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          <PredictionsCard predictions={predictions} />
          {StatusSection}
          {ReliabilitySection}
          {SpecificationsSection}
          {FinancialsSection}
          {MetersSection}
          {HealthSection}
          {DowntimeSection}
        </div>
        <div className="col-span-8 space-y-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({attachmentsWithUrls.length})
              </TabsTrigger>
              <TabsTrigger value="bom">Parts (BOM)</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              {HistorySection}
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              {DocumentsSection}
            </TabsContent>
            <TabsContent value="bom" className="mt-4">
              {/* Full table for desktop */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table className="w-full text-sm">
                  <TableHeader className="bg-muted border-b border-border">
                    <TableRow className="text-left font-medium text-muted-foreground">
                      <TableHead className="p-3">Part</TableHead>
                      <TableHead className="p-3">SKU</TableHead>
                      <TableHead className="p-3 text-center">
                        Required
                      </TableHead>
                      <TableHead className="p-3 text-center">
                        In Stock
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {equipmentItem.model?.bom.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "animate-in fade-in slide-in-from-bottom-1",
                          index < 8
                            ? `animate-stagger-${index + 1}`
                            : "animate-in fade-in duration-500"
                        )}
                      >
                        <TableCell className="p-3 font-medium">
                          {item.part.name}
                        </TableCell>
                        <TableCell className="p-3">{item.part.sku}</TableCell>
                        <TableCell className="p-3 text-center">
                          {item.quantityRequired}
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <Badge
                            variant={
                              item.part.inventoryLevels.reduce(
                                (a, b) => a + b.quantity,
                                0
                              ) > 0
                                ? "success"
                                : "danger"
                            }
                          >
                            {item.part.inventoryLevels.reduce(
                              (a, b) => a + b.quantity,
                              0
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="schedules" className="mt-4">
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {equipmentItem.maintenanceSchedules.map((schedule, index) => (
                  <div
                    key={schedule.id}
                    className={cn(
                      "p-4 flex justify-between items-center text-sm animate-in fade-in slide-in-from-bottom-1",
                      index < 5
                        ? `animate-stagger-${index + 1}`
                        : "animate-in fade-in duration-500"
                    )}
                  >
                    <span>{schedule.title}</span>
                    <Badge variant="outline">
                      {schedule.nextDue ? formatRelativeTime(schedule.nextDue) : "Not set"}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="logs" className="mt-4">
              <AuditLogList
                entityType="equipment"
                entityId={equipmentItem.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

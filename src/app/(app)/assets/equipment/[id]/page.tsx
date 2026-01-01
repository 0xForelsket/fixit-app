import { isFavorite } from "@/actions/favorites";
import { AuditLogList } from "@/components/audit/audit-log-list";
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
import { equipment as equipmentTable } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { cn, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit,
  History,
  Info,
  MapPin,
  Package,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getEquipmentItem(id: string) {
  return db.query.equipment.findFirst({
    where: eq(equipmentTable.id, id),
    with: {
      type: {
        with: {
          category: true,
        },
      },
      location: true,
      owner: true,
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

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: equipmentId } = await params;

  // Parallelize all initial data fetching
  const [equipmentItem, user, favoriteResult] = await Promise.all([
    getEquipmentItem(equipmentId),
    getCurrentUser(),
    isFavorite("equipment", equipmentId),
  ]);

  if (!equipmentItem) {
    notFound();
  }

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
          <Link href={`/assets/equipment/${equipmentItem.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            EDIT EQUIPMENT
          </Link>
        </Button>
      )}
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-8">
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
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href={`/assets/equipment/${equipmentItem.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 lg:hidden">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bom">
              <Package className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="schedules">
              <Calendar className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {StatusSection}
            {HealthSection}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {HistorySection}
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
                      schedule.nextDue < new Date()
                        ? "text-red-600"
                        : "text-emerald-600"
                    )}
                  >
                    Next: {formatRelativeTime(schedule.nextDue)}
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
            <AuditLogList entityType="equipment" entityId={equipmentId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        <div className="col-span-4 space-y-6">
          {StatusSection}
          {HealthSection}
        </div>
        <div className="col-span-8 space-y-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="bom">Parts (BOM)</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              {HistorySection}
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
                      {formatRelativeTime(schedule.nextDue)}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="logs" className="mt-4">
              <AuditLogList entityType="equipment" entityId={equipmentId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Mobile Bottom Action */}
      {hasPermission(user?.permissions ?? [], PERMISSIONS.EQUIPMENT_UPDATE) && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/80 backdrop-blur-lg border-t border-border lg:hidden z-30">
          <Button asChild size="lg" className="w-full">
            <Link href={`/assets/equipment/${equipmentItem.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Equipment
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

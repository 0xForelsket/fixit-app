import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
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

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const equipmentId = Number.parseInt(id);

  if (Number.isNaN(equipmentId)) {
    notFound();
  }

  const equipmentItem = await db.query.equipment.findFirst({
    where: eq(equipmentTable.id, equipmentId),
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

  if (!equipmentItem) {
    notFound();
  }

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

  const OverviewHeader = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="lg:hidden">
          <Link href="/assets/equipment">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {equipmentItem.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1 text-xs sm:text-sm">
            <Badge
              variant="outline"
              className="font-mono bg-zinc-50 px-1.5 py-0"
            >
              {equipmentItem.code}
            </Badge>
            {equipmentItem.type && (
              <Badge variant="secondary" className="font-bold">
                {equipmentItem.type.category.label} / {equipmentItem.type.name}
              </Badge>
            )}
            {equipmentItem.model && (
              <span className="border-l pl-2 ml-1">
                Model:{" "}
                <Link
                  href={`/assets/equipment/models/${equipmentItem.model.id}`}
                  className="font-medium hover:underline text-primary-600 truncate max-w-[150px] inline-block align-bottom"
                >
                  {equipmentItem.model.name}
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
      <Button variant="outline" asChild className="hidden sm:flex">
        <Link href={`/assets/equipment/${equipmentItem.id}/edit`}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Equipment
        </Link>
      </Button>
    </div>
  );

  const HealthSection = (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
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
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
    <div className="rounded-xl border bg-white p-6 shadow-sm">
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
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
          {equipmentItem.workOrders.slice(0, 10).map((workOrder) => (
            <Link
              key={workOrder.id}
              href={`/maintenance/work-orders/${workOrder.id}`}
              className="block p-4 hover:bg-slate-50 transition-colors"
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
                <span
                  className={cn(
                    "font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                    workOrder.status === "open"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {workOrder.status}
                </span>
                <span className="text-muted-foreground italic">
                  {workOrder.assignedTo?.name || "Unassigned"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-8">
      {/* Desktop Header Navigation */}
      <div className="hidden lg:flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/assets/equipment" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </Link>
        </Button>
      </div>

      <div className="space-y-6 lg:hidden">
        {OverviewHeader}
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
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {StatusSection}
            {HealthSection}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {HistorySection}
          </TabsContent>

          <TabsContent value="bom" className="mt-6">
            <div className="rounded-xl border bg-white shadow-sm p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Recommended Spares
              </h3>
              {/* Simplified BOM for mobile */}
              <div className="space-y-3">
                {equipmentItem.model?.bom.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-50 rounded-lg border"
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
            <div className="rounded-xl border bg-white shadow-sm divide-y">
              {equipmentItem.maintenanceSchedules.map((schedule) => (
                <div key={schedule.id} className="p-4">
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
        </Tabs>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        <div className="col-span-12">{OverviewHeader}</div>
        <div className="col-span-4 space-y-6">
          {StatusSection}
          {HealthSection}
        </div>
        <div className="col-span-8 space-y-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="bom">Parts (BOM)</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              {HistorySection}
            </TabsContent>
            <TabsContent value="bom" className="mt-4">
              {/* Full table for desktop */}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-left font-medium text-muted-foreground">
                      <th className="p-3">Part</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Required</th>
                      <th className="p-3 text-center">In Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {equipmentItem.model?.bom.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium">{item.part.name}</td>
                        <td className="p-3">{item.part.sku}</td>
                        <td className="p-3 text-center">
                          {item.quantityRequired}
                        </td>
                        <td className="p-3 text-center">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="schedules" className="mt-4">
              <div className="rounded-xl border bg-white shadow-sm divide-y">
                {equipmentItem.maintenanceSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 flex justify-between items-center text-sm"
                  >
                    <span>{schedule.title}</span>
                    <Badge variant="outline">
                      {formatRelativeTime(schedule.nextDue)}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Mobile Bottom Action */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t lg:hidden z-30">
        <Button
          asChild
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 rounded-xl"
        >
          <Link href={`/assets/equipment/${equipmentItem.id}/edit`}>
            <Edit className="mr-2 h-5 w-5" /> Edit Equipment
          </Link>
        </Button>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { machines } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit,
  History,
  MapPin,
  Package,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const machineId = Number.parseInt(id);

  if (Number.isNaN(machineId)) {
    notFound();
  }

  const machine = await db.query.machines.findFirst({
    where: eq(machines.id, machineId),
    with: {
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
      tickets: {
        orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
        with: {
          assignedTo: true,
        },
        limit: 50,
      },
      maintenanceSchedules: true,
    },
  });

  if (!machine) {
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
    statusConfigs[machine.status] || statusConfigs.operational;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/machines">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {machine.name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="outline" className="font-mono">
                {machine.code}
              </Badge>
              {machine.model && (
                <span className="text-sm">
                  Model:{" "}
                  <Link
                    href={`/admin/machines/models/${machine.model.id}`}
                    className="font-medium hover:underline text-primary-600"
                  >
                    {machine.model.name}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/machines/${machine.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Machine
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Status Card */}
        <div className="md:col-span-3 lg:col-span-1 space-y-6">
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
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn("font-medium", statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {machine.location.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Owner</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {machine.owner?.name || "Unassigned"}
                </span>
              </div>
              {machine.model?.manufacturer && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">
                    Manufacturer
                  </span>
                  <span className="font-medium">
                    {machine.model.manufacturer}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        
        {/* Compliance/Health Card */}
        <div className="space-y-6">
           <div className="rounded-xl border bg-white p-6 shadow-sm">
             <h3 className="font-semibold mb-4 flex items-center gap-2">
               <CheckCircle2 className="h-4 w-4 text-emerald-600" />
               Maintenance Health
             </h3>
             
             <div className="space-y-4">
                {(() => {
                  const maintenanceTickets = machine.tickets.filter(
                    t => t.type === 'maintenance' || t.type === 'calibration'
                  );
                  const resolved = maintenanceTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
                  const totalResolved = resolved.length;
                  
                  // Simple compliance: % of maintenance tickets that are resolved
                  // Better compliance: On-time rate (if dueBy exists)
                  const onTime = resolved.filter(t => {
                     if (!t.dueBy || !t.resolvedAt) return true; // Assume on time if no deadline
                     return t.resolvedAt <= t.dueBy;
                  }).length;

                  const rate = totalResolved > 0 ? Math.round((onTime / totalResolved) * 100) : 100;
                  
                  return (
                    <>
                      <div className="flex items-end justify-between">
                         <span className="text-3xl font-bold">{rate}%</span>
                         <span className="text-xs text-muted-foreground mb-1">On-Time Rate</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={cn("h-full rounded-full transition-all", 
                             rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-rose-500"
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
                            <p className="text-xs text-muted-foreground">Total Tickets</p>
                            <p className="font-medium text-lg">{maintenanceTickets.length}</p>
                         </div>
                      </div>
                    </>
                  );
                })()}
             </div>
           </div>
        </div>

        {/* Main Content Tabs */}
        <div className="md:col-span-3 lg:col-span-2">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="bom">Parts (BOM)</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
            </TabsList>

            {/* Maintenance History */}
            <TabsContent value="history" className="mt-4 space-y-4">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Tickets
                  </h3>
                </div>
                {machine.tickets.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No tickets found for this machine.
                  </div>
                ) : (
                  <div className="divide-y">
                    {machine.tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="block p-4 hover:bg-slate-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{ticket.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(ticket.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span
                            className={cn(
                              "capitalize",
                              ticket.status === "open" && "text-blue-600",
                              ticket.status === "resolved" && "text-green-600"
                            )}
                          >
                            {ticket.status}
                          </span>
                          <span>
                            {ticket.assignedTo
                              ? `Tech: ${ticket.assignedTo.name}`
                              : "Unassigned"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* BOM / Parts */}
            <TabsContent value="bom" className="mt-4 space-y-4">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4 flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Recommended Spares
                  </h3>
                  {machine.model && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/machines/models/${machine.model.id}`}>
                        Edit BOM
                      </Link>
                    </Button>
                  )}
                </div>
                {!machine.model ? (
                  <div className="p-8 text-center text-muted-foreground">
                    This machine is not linked to a Model. <br />
                    <Link
                      href={`/admin/machines/${machine.id}/edit`}
                      className="underline text-primary-600"
                    >
                      Assign a model
                    </Link>{" "}
                    to see recommended parts.
                  </div>
                ) : machine.model.bom.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No parts defined in the BOM for {machine.model.name}.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-left font-medium text-muted-foreground">
                        <th className="p-3">Part</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-center">Required</th>
                        <th className="p-3 text-center">In Stock</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {machine.model.bom.map((item) => {
                        const inStock = item.part.inventoryLevels.reduce(
                          (acc, level) => acc + level.quantity,
                          0
                        );
                        const isLow = inStock < (item.part.reorderPoint || 1);
                        return (
                          <tr key={item.id}>
                            <td className="p-3 font-medium">
                              {item.part.name}
                            </td>
                            <td className="p-3">{item.part.sku}</td>
                            <td className="p-3 text-center">
                              {item.quantityRequired}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  isLow
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-100 text-emerald-700"
                                )}
                              >
                                {inStock}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                              {item.notes}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>

            {/* Schedules */}
            <TabsContent value="schedules" className="mt-4 space-y-4">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    active Schedules
                  </h3>
                </div>
                {machine.maintenanceSchedules.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No maintenance schedules found.
                  </div>
                ) : (
                  <div className="divide-y">
                    {machine.maintenanceSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {schedule.type} • Every {schedule.frequencyDays}{" "}
                            days
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Next Due</p>
                          <p
                            className={cn(
                              "text-sm",
                              schedule.nextDue < new Date()
                                ? "text-rose-600 font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatRelativeTime(schedule.nextDue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-4 bg-slate-50 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="w-full"
                  >
                    <Link href="/dashboard/maintenance/schedules/new">
                      Create Schedule
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

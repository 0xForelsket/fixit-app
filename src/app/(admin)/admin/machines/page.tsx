import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { machines } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  MapPin,
  MonitorCog,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  status?: string;
  location?: string;
  search?: string;
};

async function getMachines(params: SearchParams) {
  const machinesList = await db.query.machines.findMany({
    orderBy: [desc(machines.createdAt)],
    with: {
      location: true,
      owner: true,
    },
  });

  let filtered = machinesList;

  if (params.status && params.status !== "all") {
    filtered = filtered.filter((m) => m.status === params.status);
  }

  if (params.search) {
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        m.code.toLowerCase().includes(params.search!.toLowerCase())
    );
  }

  return filtered;
}

async function getMachineStats() {
  const allMachines = await db.query.machines.findMany();
  return {
    total: allMachines.length,
    operational: allMachines.filter((m) => m.status === "operational").length,
    down: allMachines.filter((m) => m.status === "down").length,
    maintenance: allMachines.filter((m) => m.status === "maintenance").length,
  };
}

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const machinesList = await getMachines(params);
  const stats = await getMachineStats();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Machine Management
          </h1>
          <p className="text-muted-foreground">
            {stats.total} machines • {stats.operational} operational
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/machines/models">Manage Models</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/machines/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={MonitorCog}
          color="text-primary-600"
          bg="bg-primary-50"
          href="/admin/machines"
          active={!params.status || params.status === "all"}
        />
        <StatsCard
          title="Operational"
          value={stats.operational}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          href="?status=operational"
          active={params.status === "operational"}
        />
        <StatsCard
          title="Down"
          value={stats.down}
          icon={AlertCircle}
          color="text-rose-600"
          bg="bg-rose-50"
          href="?status=down"
          active={params.status === "down"}
        />
        <StatsCard
          title="Maintenance"
          value={stats.maintenance}
          icon={Wrench}
          color="text-amber-600"
          bg="bg-amber-50"
          href="?status=maintenance"
          active={params.status === "maintenance"}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <form className="flex-1 max-w-md" action="/admin/machines" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search by name or code..."
              defaultValue={params.search}
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </div>
        </form>
      </div>

      {/* Machines Table */}
      {machinesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MonitorCog className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No machines found</h3>
          <p className="text-sm text-muted-foreground">
            {params.search || params.status
              ? "Try adjusting your filters"
              : "Add your first machine to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="p-4">Machine</th>
                <th className="p-4 hidden md:table-cell">Code</th>
                <th className="p-4 hidden lg:table-cell">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden xl:table-cell">Owner</th>
                <th className="p-4 hidden sm:table-cell">Created</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {machinesList.map((machine) => {
                const statusConfig =
                  statusConfigs[machine.status] || statusConfigs.operational;
                const StatusIcon = statusConfig.icon;

                return (
                  <tr
                    key={machine.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <MonitorCog className="h-5 w-5 text-primary-600" />
                        </div>
                        <p className="font-medium">{machine.name}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
                        {machine.code}
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {machine.location?.name || "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {machine.owner?.name || "—"}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(machine.createdAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/machines/${machine.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  href,
  active,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md bg-white",
        active && "ring-2 ring-primary-500 border-primary-300"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </Link>
  );
}

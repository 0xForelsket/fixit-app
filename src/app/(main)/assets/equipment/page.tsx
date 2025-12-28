import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import { cn } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  AlertCircle,
  CheckCircle2,
  Cuboid,
  Edit,
  Flag,
  MapPin,
  MonitorCog,
  Plus,
  Search,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { SortHeader } from "@/components/ui/sort-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParams = {
  status?: string;
  location?: string;
  search?: string;
  sort?: "name" | "code" | "status" | "location" | "classification" | "responsible";
  dir?: "asc" | "desc";
};

async function getEquipment(params: SearchParams) {
  const equipmentList = await db.query.equipment.findMany({
    orderBy: [desc(equipmentTable.createdAt)],
    with: {
      location: true,
      owner: true,
      type: {
        with: {
          category: true,
        },
      },
    },
  });

  let filtered = equipmentList;

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

  if (params.sort) {
    filtered.sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (params.sort) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "code":
          valA = a.code.toLowerCase();
          valB = b.code.toLowerCase();
          break;
        case "status":
          valA = a.status;
          valB = b.status;
          break;
        case "location":
          valA = a.location?.name.toLowerCase() || "";
          valB = b.location?.name.toLowerCase() || "";
          break;
        case "classification":
          valA = a.type?.name.toLowerCase() || "";
          valB = b.type?.name.toLowerCase() || "";
          break;
        case "responsible":
          valA = a.owner?.name.toLowerCase() || "";
          valB = b.owner?.name.toLowerCase() || "";
          break;
      }

      if (valA < valB) return params.dir === "desc" ? 1 : -1;
      if (valA > valB) return params.dir === "desc" ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

async function getEquipmentStats() {
  const allEquipment = await db.query.equipment.findMany();
  return {
    total: allEquipment.length,
    operational: allEquipment.filter((m) => m.status === "operational").length,
    down: allEquipment.filter((m) => m.status === "down").length,
    maintenance: allEquipment.filter((m) => m.status === "maintenance").length,
  };
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const equipmentList = await getEquipment(params);
  const stats = await getEquipmentStats();

  const statusConfigs: Record<
    string,
    {
      icon: React.ElementType;
      color: string;
      bg: string;
      dotClass: string;
      label: string;
    }
  > = {
    operational: {
      icon: CheckCircle2,
      color: "text-success-700",
      bg: "bg-success-50/50 border-success-100",
      dotClass: "status-operational",
      label: "Operational",
    },
    down: {
      icon: AlertCircle,
      color: "text-danger-700",
      bg: "bg-danger-50/50 border-danger-100",
      dotClass: "status-down",
      label: "Down",
    },
    maintenance: {
      icon: Wrench,
      color: "text-warning-700",
      bg: "bg-warning-50/50 border-warning-100",
      dotClass: "status-maintenance",
      label: "Maintenance",
    },
  };

  return (
    <div className="space-y-10 animate-in">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Equipment <span className="text-primary-600">List</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <MonitorCog className="h-3.5 w-3.5" />
            {stats.total} REGISTERED UNITS • {stats.operational} ONLINE
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/import">
              <Upload className="mr-2 h-4 w-4" />
              BULK IMPORT
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/assets/equipment/models">
              <Cuboid className="mr-2 h-4 w-4" />
              VIEW MODELS
            </Link>
          </Button>
          <Button
            asChild
          >
            <Link href="/assets/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD EQUIPMENT
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <StatsCard
          title="Total Units"
          value={stats.total}
          icon={MonitorCog}
          color="text-zinc-600"
          bg="bg-zinc-100"
          href="/assets/equipment"
          active={!params.status || params.status === "all"}
        />
        <StatsCard
          title="Operational"
          value={stats.operational}
          icon={CheckCircle2}
          color="text-success-600"
          bg="bg-success-100"
          href="?status=operational"
          active={params.status === "operational"}
        />
        <StatsCard
          title="Down"
          value={stats.down}
          icon={AlertCircle}
          color="text-danger-600"
          bg="bg-danger-100"
          href="?status=down"
          active={params.status === "down"}
        />
        <StatsCard
          title="Maintenance"
          value={stats.maintenance}
          icon={Wrench}
          color="text-warning-600"
          bg="bg-warning-100"
          href="?status=maintenance"
          active={params.status === "maintenance"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 p-4 rounded-xl border border-zinc-200 backdrop-blur-sm mb-6">
        <form
          className="w-full sm:max-w-md"
          action="/assets/equipment"
          method="get"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              name="search"
              placeholder="SEARCH BY NAME OR SERIAL..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all uppercase"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </div>
        </form>
        {params.status && params.status !== "all" && (
           <Link
             href="/assets/equipment"
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-bold hover:bg-zinc-200 transition-colors"
           >
             Status: {params.status}
             <X className="h-3 w-3" />
           </Link>
        )}
      </div>

      {/* Equipment Table */}
      {equipmentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-20 text-center animate-in backdrop-blur-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 border border-zinc-200 shadow-inner">
            <MonitorCog className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mt-6 text-xl font-black text-zinc-900 tracking-tight uppercase">
            No assets identified
          </h3>
          <p className="text-zinc-500 font-medium mt-1">
            {params.search || params.status
              ? "Refine parameters to adjust scan results"
              : "Register your first equipment to begin monitoring."}
          </p>
          {(params.search || params.status) && (
            <Button variant="outline" className="mt-6 font-bold" asChild>
              <Link href="/assets/equipment">
                <X className="mr-2 h-4 w-4" />
                CLEAR FILTERS
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm shadow-xl shadow-zinc-200/20">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent border-zinc-200">
                <SortHeader
                  label="Code"
                  field="code"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="w-32"
                />
                <SortHeader
                  label="Equipment / Asset"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                />
                <SortHeader
                  label="Classification"
                  field="classification"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  className="hidden lg:table-cell"
                  params={params}
                />
                <SortHeader
                  label="Location"
                  field="location"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  className="hidden lg:table-cell"
                  params={params}
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                />
                <SortHeader
                  label="Responsible"
                  field="responsible"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  className="hidden xl:table-cell"
                  params={params}
                />
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {equipmentList.map((equipment) => {
                const statusConfig =
                  statusConfigs[equipment.status] || statusConfigs.operational;

                return (
                  <TableRow
                    key={equipment.id}
                    className="hover:bg-zinc-50 transition-colors group"
                  >
                    <TableCell className="p-5">
                       <span className="font-mono font-bold text-zinc-500 uppercase tracking-widest text-xs">
                        {equipment.code}
                       </span>
                    </TableCell>
                    <TableCell className="p-5">
                      <Link
                        href={`/assets/equipment/${equipment.id}`}
                        data-testid="equipment-link"
                        className="flex items-center gap-4 group/item"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-md transition-transform group-hover/item:scale-105">
                          <MonitorCog className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 group-hover/item:text-primary-600 transition-colors uppercase tracking-tight text-sm">
                            {equipment.name}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                             ID: {equipment.id}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      {equipment.type ? (
                        <div className="inline-flex flex-col bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                            {equipment.type.category.label}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {equipment.type.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-zinc-400 tracking-widest bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                          UNCLASSIFIED
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/50 w-fit">
                        <MapPin className="h-3.5 w-3.5" />
                        {equipment.location?.name || "UNASSIGNED"}
                      </div>
                    </TableCell>
                    <TableCell className="p-5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm",
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            statusConfig.dotClass.replace("status-", "bg-")
                          )}
                        />
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 hidden xl:table-cell">
                      <span className={cn("text-sm font-bold", equipment.owner?.name ? "text-zinc-900" : "text-zinc-400 italic")}>
                        {equipment.owner?.name || "OFF-SYSTEM"}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 text-right flex items-center justify-end gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-xl hover:bg-amber-500 hover:text-white transition-all text-zinc-400"
                        title="Report Issue"
                      >
                        <Link href={`/maintenance/work-orders/new?equipmentId=${equipment.id}`}>
                          <Flag className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-xl hover:bg-primary-500 hover:text-white transition-all transform group-hover:rotate-12 text-zinc-400"
                      >
                        <Link href={`/assets/equipment/${equipment.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
        "flex flex-col justify-between h-[120px] rounded-2xl border bg-white p-5 transition-all duration-300 hover-lift card-industrial shadow-sm",
        active
          ? "border-primary-400 ring-4 ring-primary-500/10 shadow-lg shadow-primary-500/5"
          : "border-zinc-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shadow-inner border border-white/50",
            bg
          )}
        >
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        {active && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none mb-1.5">
          {title}
        </p>
        <p
          className={cn(
            "text-3xl font-mono font-black tracking-tighter leading-none",
            color === "text-zinc-600" ? "text-zinc-900" : color
          )}
        >
          {value}
        </p>
      </div>
    </Link>
  );
}


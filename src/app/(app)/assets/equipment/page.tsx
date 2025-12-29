import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SortHeader } from "@/components/ui/sort-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AssetTree } from "./explorer/asset-tree";
import { ViewToggle } from "@/components/ui/view-toggle";
import { type SessionUser, getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { PageContainer } from "@/components/ui/page-container";
import { StatsTicker } from "@/components/ui/stats-ticker";

type SearchParams = {
  status?: string;
  location?: string;
  search?: string;
  sort?:
    | "name"
    | "code"
    | "status"
    | "location"
    | "classification"
    | "responsible";
  dir?: "asc" | "desc";
  view?: "list" | "tree";
};

async function getEquipment(params: SearchParams, user: SessionUser | null) {
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";

  const conditions = [];

  if (isTech && departmentId) {
    conditions.push(eq(equipmentTable.departmentId, departmentId));
  }

  const equipmentList = await db.query.equipment.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
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

async function getEquipmentStats(user: SessionUser | null) {
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";

  const conditions = [];
  if (isTech && departmentId) {
    conditions.push(eq(equipmentTable.departmentId, departmentId));
  }

  const allEquipment = await db.query.equipment.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
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
  const user = await getCurrentUser();
  const equipmentList = await getEquipment(params, user);
  const stats = await getEquipmentStats(user);

  return (
    <PageContainer id="equipment-page" className="space-y-10">
      <PageHeader
        title="Asset Inventory"
        subtitle="Infrastructure Monitoring"
        description={`${stats.total} REGISTERED UNITS | ${stats.operational} ONLINE`}
        bgSymbol="EQ"
        actions={
          <>
            <ViewToggle />
            <div className="w-px h-8 bg-border mx-2 hidden lg:block" />
            <Button variant="outline" asChild className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all">
              <Link href="/admin/import?type=equipment">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all">
              <Link href="/assets/equipment/models">
                <Cuboid className="mr-2 h-4 w-4" />
                Models
              </Link>
            </Button>
            <Button asChild className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
              <Link href="/assets/equipment/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          </>
        }
      />

      <StatsTicker
        stats={[
          {
            label: "Total Inventory",
            value: stats.total,
            icon: MonitorCog,
            variant: "default",
          },
          {
            label: "Operational",
            value: stats.operational,
            icon: CheckCircle2,
            variant: "success",
          },
          {
            label: "Maintenance / Down",
            value: stats.maintenance + stats.down,
            icon: AlertCircle,
            variant: "danger",
          },
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border backdrop-blur-sm mb-6">
        <form
          className="w-full sm:max-w-md"
          action="/assets/equipment"
          method="get"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="SEARCH BY NAME OR SERIAL..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
            />
            {params.status && (
              <input type="hidden" name="status" value={params.status} />
            )}
          </div>
        </form>
        {params.status && params.status !== "all" && (
          <Link
            href="/assets/equipment"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold hover:bg-muted-foreground/10 transition-colors text-muted-foreground"
          >
            Status: {params.status}
            <X className="h-3 w-3" />
          </Link>
        )}
      </div>

      {params.view === "tree" ? (
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-xl shadow-border/20 overflow-hidden">
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-2xl" />}>
            <AssetTree initialEquipment={equipmentList} />
          </Suspense>
        </div>
      ) : (
        <>
          {/* Equipment Table */}
          {equipmentList.length === 0 ? (
        <EmptyState
          title="No assets identified"
          description={
            params.search || params.status
              ? "Refine parameters to adjust scan results"
              : "Register your first equipment to begin monitoring."
          }
          icon={MonitorCog}
        >
          {(params.search || params.status) && (
            <Button variant="outline" className="font-bold" asChild>
              <Link href="/assets/equipment">
                <X className="mr-2 h-4 w-4" />
                CLEAR FILTERS
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
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
            <TableBody className="divide-y divide-border">
              {equipmentList.map((equipment, index) => {
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";
                return (
                  <TableRow
                    key={equipment.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors group animate-in fade-in slide-in-from-bottom-1",
                      staggerClass
                    )}
                  >
                    <TableCell className="p-5">
                      <span className="font-mono font-bold text-muted-foreground uppercase tracking-widest text-xs">
                        {equipment.code}
                      </span>
                    </TableCell>
                    <TableCell className="p-5">
                      <Link
                        href={`/assets/equipment/${equipment.id}`}
                        data-testid="equipment-link"
                        className="flex items-center gap-4 group/item"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform group-hover/item:scale-105">
                          <MonitorCog className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-foreground group-hover/item:text-primary transition-colors uppercase tracking-tight text-sm font-serif-brand">
                            {equipment.name}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            ID: {equipment.id}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      {equipment.type ? (
                        <div className="inline-flex flex-col bg-muted px-2.5 py-1 rounded-md border border-border">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                            {equipment.type.category.label}
                          </span>
                          <span className="text-xs font-bold text-foreground/80">
                            {equipment.type.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground tracking-widest bg-muted/50 px-2 py-1 rounded-md border border-border">
                          UNCLASSIFIED
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border w-fit">
                        <MapPin className="h-3.5 w-3.5" />
                        {equipment.location?.name || "UNASSIGNED"}
                      </div>
                    </TableCell>
                    <TableCell className="p-5">
                      <StatusBadge status={equipment.status} />
                    </TableCell>
                    <TableCell className="p-5 hidden xl:table-cell">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          equipment.owner?.name
                            ? "text-foreground/80"
                            : "text-muted-foreground italic"
                        )}
                      >
                        {equipment.owner?.name || "OFF-SYSTEM"}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-xl hover:bg-warning-500 hover:text-white transition-all text-muted-foreground"
                        title="Report Issue"
                      >
                        <Link
                          href={`/maintenance/work-orders/new?equipmentId=${equipment.id}`}
                        >
                          <Flag className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all transform group-hover:rotate-12 text-muted-foreground"
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
        </>
      )}
    </PageContainer>
  );
}

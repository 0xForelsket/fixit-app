import { getFavoriteIds } from "@/actions/favorites";
import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { ViewToggle } from "@/components/ui/view-toggle";
import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import {
  PERMISSIONS,
  hasPermission,
} from "@/lib/permissions";
import { type SessionUser, getCurrentUser } from "@/lib/session";
import { desc } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import {
  AlertCircle,
  CheckCircle2,
  Cuboid,
  MonitorCog,
  Plus,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AssetTree } from "./explorer/asset-tree";

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

  const favoriteResult = await getFavoriteIds("equipment");
  const favoriteIds = favoriteResult.success ? (favoriteResult.data ?? []) : [];

  return (
    <PageLayout
      title="Asset Inventory"
      subtitle="Infrastructure Monitoring"
      description={`${stats.total} REGISTERED UNITS | ${stats.operational} ONLINE`}
      bgSymbol="EQ"
      headerActions={
        <>
          <ViewToggle />
          <div className="w-px h-8 bg-border mx-2 hidden lg:block" />
          {hasPermission(user.permissions, PERMISSIONS.EQUIPMENT_CREATE) && (
            <Button
              variant="outline"
              asChild
              className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
            >
              <Link href="/admin/import?type=equipment">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Link>
            </Button>
          )}
          {hasPermission(
            user.permissions,
            PERMISSIONS.EQUIPMENT_MANAGE_MODELS
          ) && (
            <Button
              variant="outline"
              asChild
              className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
            >
              <Link href="/assets/equipment/models">
                <Cuboid className="mr-2 h-4 w-4" />
                Models
              </Link>
            </Button>
          )}
          {hasPermission(user.permissions, PERMISSIONS.EQUIPMENT_CREATE) && (
            <Button
              asChild
              className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
            >
              <Link href="/assets/equipment/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          )}
        </>
      }
      stats={
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
      }
      filters={<EquipmentFilters searchParams={params} />}
    >
      {params.view === "tree" ? (
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-xl shadow-border/20 overflow-hidden">
          <Suspense
            fallback={
              <div className="h-96 animate-pulse bg-muted rounded-2xl" />
            }
          >
            <AssetTree initialEquipment={equipmentList} />
          </Suspense>
        </div>
      ) : (
        <>
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
            <EquipmentTable
              equipment={equipmentList}
              searchParams={params}
              favoriteIds={favoriteIds}
              userPermissions={user?.permissions}
            />
          )}
        </>
      )}
    </PageLayout>
  );
}

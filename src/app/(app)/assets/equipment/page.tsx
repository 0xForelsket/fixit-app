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
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
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

async function getEquipment(params: SearchParams, conditions: any[]) {
  // Handle sorting in SQL
  let orderBy;
  const sortDir = params.dir === "desc" ? desc : asc;

  switch (params.sort) {
    case "name":
      orderBy = sortDir(equipmentTable.name);
      break;
    case "code":
      orderBy = sortDir(equipmentTable.code);
      break;
    case "status":
      orderBy = sortDir(equipmentTable.status);
      break;
    default:
      orderBy = desc(equipmentTable.createdAt);
  }

  return db.query.equipment.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [orderBy],
    columns: {
      id: true,
      code: true,
      name: true,
      status: true,
      createdAt: true,
      parentId: true,
      locationId: true,
      ownerId: true,
      typeId: true,
      departmentId: true,
    },
    with: {
      location: {
        columns: {
          id: true,
          name: true,
        },
      },
      owner: {
        columns: {
          id: true,
          name: true,
        },
      },
      type: {
        columns: {
          id: true,
          name: true,
          categoryId: true,
        },
        with: {
          category: {
            columns: {
              id: true,
              label: true,
            },
          },
        },
      },
    },
  });
}

// Stats aggregation in a single query
async function getEquipmentStats(conditions: any[]) {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      operational: sql<number>`count(case when ${equipmentTable.status} = 'operational' then 1 end)`,
      down: sql<number>`count(case when ${equipmentTable.status} = 'down' then 1 end)`,
      maintenance: sql<number>`count(case when ${equipmentTable.status} = 'maintenance' then 1 end)`,
    })
    .from(equipmentTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    total: Number(result?.total || 0),
    operational: Number(result?.operational || 0),
    down: Number(result?.down || 0),
    maintenance: Number(result?.maintenance || 0),
  };
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // Build conditions for both list and stats
  const departmentId = user?.departmentId;
  const isTech = user?.roleName === "tech";
  const conditions = [];

  if (isTech && departmentId) {
    conditions.push(eq(equipmentTable.departmentId, departmentId));
  }

  if (params.status && params.status !== "all") {
    conditions.push(eq(equipmentTable.status, params.status as any));
  }

  if (params.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        like(equipmentTable.name, searchPattern),
        like(equipmentTable.code, searchPattern)
      )
    );
  }

  if (params.location) {
    conditions.push(eq(equipmentTable.locationId, Number(params.location)));
  }

  // Parallelize remaining data fetching
  const [equipmentList, stats, favoriteResult] = await Promise.all([
    getEquipment(params, conditions),
    getEquipmentStats(conditions),
    getFavoriteIds("equipment"),
  ]);

  const favoriteIds = favoriteResult.success ? (favoriteResult.data ?? []) : [];

  return (
    <PageLayout
      title="Equipment List"
      subtitle="Infrastructure Monitoring"
      description={`${stats.total} REGISTERED UNITS | ${stats.operational} ONLINE`}
      bgSymbol="EQ"
      headerActions={
        <>
          <ViewToggle />
          <div className="w-px h-8 bg-border mx-2 hidden lg:block" />
          {hasPermission(
            user?.permissions ?? [],
            PERMISSIONS.EQUIPMENT_CREATE
          ) && (
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
            user?.permissions ?? [],
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
          {hasPermission(
            user?.permissions ?? [],
            PERMISSIONS.EQUIPMENT_CREATE
          ) && (
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

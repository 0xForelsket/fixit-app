import { EquipmentGrid } from "@/app/(app)/equipment-grid";
import { EquipmentSearch } from "@/app/(app)/equipment-search";
import { db } from "@/db";
import { equipment } from "@/db/schema";
import { and, eq, like, sql } from "drizzle-orm";

interface ReportPageProps {
  searchParams: Promise<{ search?: string; location?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const locationId = params.location ? Number(params.location) : undefined;

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${like(equipment.name, `%${search}%`)} OR ${like(equipment.code, `%${search}%`)})`
    );
  }

  if (locationId) {
    conditions.push(eq(equipment.locationId, locationId));
  }

  const whereClause =
    conditions.length > 0
      ? conditions.length > 1
        ? and(...conditions)
        : conditions[0]
      : undefined;

  const equipmentList = await db.query.equipment.findMany({
    where: whereClause,
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
    with: {
      location: true,
    },
  });

  const locationList = await db.query.locations.findMany({
    orderBy: (locations, { asc }) => [asc(locations.name)],
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">
          Report Issue
        </h1>
        <p className="text-zinc-500 font-medium">
          Select an asset to submit a work request.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <EquipmentSearch locations={locationList} initialSearch={search} />
      </div>

      <EquipmentGrid equipment={equipmentList} hash="report" />
    </div>
  );
}

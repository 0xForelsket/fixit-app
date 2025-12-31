import { db } from "@/db";
import { locations, users } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EquipmentForm } from "../equipment-form";

export default async function NewEquipmentPage() {
  await requirePermission(PERMISSIONS.EQUIPMENT_CREATE);

  const [
    locationsList,
    usersList,
    modelsList,
    categoriesList,
    typesList,
    equipmentList,
    departmentsList,
  ] = await Promise.all([
    db.query.locations.findMany({
      where: eq(locations.isActive, true),
    }),
    db.query.users.findMany({
      where: eq(users.isActive, true),
    }),
    db.query.equipmentModels.findMany(),
    db.query.equipmentCategories.findMany(),
    db.query.equipmentTypes.findMany(),
    db.query.equipment.findMany({
      columns: { id: true, name: true, code: true },
    }),
    db.query.departments.findMany(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/assets/equipment"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Equipment</h1>
          <p className="text-muted-foreground">
            Add a new asset to the registry
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Suspense
          fallback={<div className="h-96 rounded-xl bg-muted animate-pulse" />}
        >
          <EquipmentForm
            locations={locationsList}
            departments={departmentsList}
            users={usersList}
            models={modelsList}
            categories={categoriesList}
            types={typesList}
            equipmentList={equipmentList}
            isNew
          />
        </Suspense>
      </div>
    </div>
  );
}

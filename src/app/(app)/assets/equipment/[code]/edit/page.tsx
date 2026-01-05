import { db } from "@/db";
import {
  attachments,
  equipment,
  equipmentMeters,
  locations,
  users,
} from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { requirePermission } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteEquipmentButton } from "../../delete-equipment-button";
import { EquipmentForm } from "../../equipment-form";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await requirePermission(PERMISSIONS.EQUIPMENT_UPDATE);
  const userPermissions = user.permissions;

  const { code: equipmentCode } = await params;

  const [
    equipmentItem,
    locationsList,
    usersList,
    modelsList,
    categoriesList,
    typesList,
    equipmentList,
    departmentsList,
  ] = await Promise.all([
    db.query.equipment.findFirst({
      where: eq(equipment.code, equipmentCode.toUpperCase()),
      with: {
        type: true,
      },
    }),
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

  if (!equipmentItem) {
    notFound();
  }

  // Load meters and attachments for this equipment
  const [metersList, attachmentsList] = await Promise.all([
    db.query.equipmentMeters.findMany({
      where: eq(equipmentMeters.equipmentId, equipmentItem.id),
    }),
    db.query.attachments.findMany({
      where: and(
        eq(attachments.entityType, "equipment"),
        eq(attachments.entityId, equipmentItem.id)
      ),
      with: {
        uploadedBy: {
          columns: { name: true },
        },
      },
    }),
  ]);

  // Generate signed URLs for attachments
  const attachmentsWithUrls = await Promise.all(
    attachmentsList.map(async (attachment) => ({
      ...attachment,
      url: await getPresignedDownloadUrl(attachment.s3Key),
    }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <DeleteEquipmentButton
          equipmentId={equipmentItem.id}
          equipmentName={equipmentItem.name}
        />
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Suspense
          fallback={<div className="h-96 rounded-xl bg-muted animate-pulse" />}
        >
          <EquipmentForm
            equipment={equipmentItem}
            locations={locationsList}
            departments={departmentsList}
            users={usersList}
            models={modelsList}
            categories={categoriesList}
            types={typesList}
            equipmentList={equipmentList}
            meters={metersList}
            attachments={attachmentsWithUrls}
            userPermissions={userPermissions}
          />
        </Suspense>
      </div>
    </div>
  );
}

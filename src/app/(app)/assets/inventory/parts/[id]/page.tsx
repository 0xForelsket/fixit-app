import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PartForm } from "../part-form";

async function getPart(id: number) {
  return db.query.spareParts.findFirst({
    where: eq(spareParts.id, id),
  });
}

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_UPDATE);

  const { id } = await params;
  const partId = Number.parseInt(id);

  if (Number.isNaN(partId)) {
    notFound();
  }

  const part = await getPart(partId);

  if (!part) {
    notFound();
  }

  return <PartForm part={part} />;
}

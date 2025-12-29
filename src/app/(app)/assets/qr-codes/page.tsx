import { db } from "@/db";
import { equipment } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { QRCodeGeneratorClient } from "./qr-code-generator";

async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: [desc(equipment.createdAt)],
    with: {
      location: true,
      owner: true,
    },
  });
}

export default async function QRCodesPage() {
  await requirePermission(PERMISSIONS.SYSTEM_QR_CODES);

  const equipmentList = await getEquipment();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return <QRCodeGeneratorClient equipment={equipmentList} baseUrl={baseUrl} />;
}

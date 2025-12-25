import { db } from "@/db";
import { machines } from "@/db/schema";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { QRCodeGeneratorClient } from "./qr-code-generator";

async function getMachines() {
  return db.query.machines.findMany({
    orderBy: [desc(machines.createdAt)],
    with: {
      location: true,
      owner: true,
    },
  });
}

export default async function QRCodesPage() {
  const machinesList = await getMachines();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <QRCodeGeneratorClient
      machines={machinesList}
      baseUrl={baseUrl}
    />
  );
}

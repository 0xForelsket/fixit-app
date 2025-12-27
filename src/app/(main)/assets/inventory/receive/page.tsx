import { ReceiveStockForm } from "@/components/inventory/receive-stock-form";
import { db } from "@/db";
import { locations, spareParts } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getData() {
  const parts = await db.query.spareParts.findMany({
    where: eq(spareParts.isActive, true),
    columns: {
      id: true,
      name: true,
      sku: true,
    },
  });

  const activeLocations = await db.query.locations.findMany({
    where: eq(locations.isActive, true),
    columns: {
      id: true,
      name: true,
    },
  });

  return { parts, locations: activeLocations };
}

export default async function ReceivePage() {
  const { parts, locations } = await getData();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receive Stock</h1>
        <p className="text-muted-foreground">Add new inventory to stock</p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <ReceiveStockForm parts={parts} locations={locations} />
      </div>
    </div>
  );
}

import { ReceiveStockForm } from "@/components/inventory/receive-stock-form";
import { PageLayout } from "@/components/ui/page-layout";
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
    <PageLayout
      id="receive-stock-page"
      title="Receive Stock"
      subtitle="Inventory Control"
      description="ADD NEW INVENTORY TO STOCK"
      bgSymbol="RS"
    >
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <ReceiveStockForm parts={parts} locations={locations} />
        </div>
      </div>
    </PageLayout>
  );
}

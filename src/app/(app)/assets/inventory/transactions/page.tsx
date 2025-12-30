import { TransactionsTable } from "@/components/inventory/transactions-table";
import { db } from "@/db";
import {
  inventoryTransactions,
  locations,
  spareParts,
  users,
} from "@/db/schema";
import { aliasedTable, asc, desc, eq } from "drizzle-orm";

const PAGE_SIZE = 50;

async function getTransactions(
  params: Promise<{
    sort?:
      | "type"
      | "quantity"
      | "createdAt"
      | "part"
      | "location"
      | "user"
      | "reference";
    dir?: "asc" | "desc";
    page?: string;
  }>
) {
  const { sort, dir, page } = await params;
  const pageNumber = Number(page || "1");
  const offset = (pageNumber - 1) * PAGE_SIZE;

  // Aliases
  const createdBy = aliasedTable(users, "created_by");
  const toLocation = aliasedTable(locations, "to_location");

  const query = db
    .select({
      id: inventoryTransactions.id,
      type: inventoryTransactions.type,
      quantity: inventoryTransactions.quantity,
      reference: inventoryTransactions.reference,
      createdAt: inventoryTransactions.createdAt,
      partName: spareParts.name,
      partSku: spareParts.sku,
      locationName: locations.name,
      toLocationName: toLocation.name,
      userName: createdBy.name,
      workOrderId: inventoryTransactions.workOrderId,
    })
    .from(inventoryTransactions)
    .leftJoin(spareParts, eq(inventoryTransactions.partId, spareParts.id))
    .leftJoin(locations, eq(inventoryTransactions.locationId, locations.id))
    .leftJoin(toLocation, eq(inventoryTransactions.toLocationId, toLocation.id))
    .leftJoin(createdBy, eq(inventoryTransactions.createdById, createdBy.id))
    .limit(PAGE_SIZE)
    .offset(offset);

  if (sort) {
    const direction = dir === "asc" ? asc : desc;
    switch (sort) {
      case "type":
        query.orderBy(direction(inventoryTransactions.type));
        break;
      case "quantity":
        query.orderBy(direction(inventoryTransactions.quantity));
        break;
      case "createdAt":
        query.orderBy(direction(inventoryTransactions.createdAt));
        break;
      case "reference":
        query.orderBy(direction(inventoryTransactions.reference));
        break;
      case "part":
        query.orderBy(direction(spareParts.name));
        break;
      case "location":
        query.orderBy(direction(locations.name));
        break;
      case "user":
        query.orderBy(direction(createdBy.name));
        break;
    }
  } else {
    query.orderBy(desc(inventoryTransactions.createdAt));
  }

  return query;
}

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    sort?:
      | "type"
      | "quantity"
      | "createdAt"
      | "part"
      | "location"
      | "user"
      | "reference";
    dir?: "asc" | "desc";
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const transactions = await getTransactions(props.searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            Log of all stock movements and adjustments
          </p>
        </div>
      </div>

      <TransactionsTable transactions={transactions} searchParams={searchParams} />
    </div>
  );
}


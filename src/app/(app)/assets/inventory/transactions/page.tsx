import { Badge } from "@/components/ui/badge";
import { SortHeader } from "@/components/ui/sort-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  inventoryTransactions,
  locations,
  spareParts,
  users,
} from "@/db/schema";
import { formatRelativeTime } from "@/lib/utils";
import { aliasedTable, asc, desc, eq } from "drizzle-orm";
import { MoveDown, MoveUp, RefreshCw, RotateCcw } from "lucide-react";

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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader
                label="Type"
                field="type"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="Part"
                field="part"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="Quantity"
                field="quantity"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="Location"
                field="location"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="Reference"
                field="reference"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="User"
                field="user"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
              <SortHeader
                label="Date"
                field="createdAt"
                currentSort={searchParams.sort}
                currentDir={searchParams.dir}
                params={searchParams}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TransactionIcon type={tx.type} />
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tx.partName}</span>
                      <span className="text-xs text-muted-foreground">
                        {tx.partSku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        tx.type === "in" || tx.type === "adjustment"
                          ? "text-emerald-600 font-medium"
                          : "text-rose-600 font-medium"
                      }
                    >
                      {tx.type === "out" || tx.type === "transfer" ? "-" : "+"}
                      {tx.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{tx.locationName}</span>
                      {tx.type === "transfer" && tx.toLocationName && (
                        <span className="text-muted-foreground">
                          → {tx.toLocationName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.workOrderId ? (
                      <Badge variant="outline">WO #{tx.workOrderId}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {tx.reference || "-"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{tx.userName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionIcon({ type }: { type: string }) {
  switch (type) {
    case "in":
      return <MoveDown className="h-4 w-4 text-emerald-600" />;
    case "out":
      return <MoveUp className="h-4 w-4 text-rose-600" />;
    case "transfer":
      return <RefreshCw className="h-4 w-4 text-blue-600" />;
    case "adjustment":
      return <RotateCcw className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
}

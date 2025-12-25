import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { inventoryTransactions } from "@/db/schema";
import { formatRelativeTime } from "@/lib/utils";
import { desc } from "drizzle-orm";
import { MoveDown, MoveUp, RefreshCw, RotateCcw } from "lucide-react";

async function getTransactions() {
  return db.query.inventoryTransactions.findMany({
    orderBy: [desc(inventoryTransactions.createdAt)],
    with: {
      part: true,
      location: true,
      toLocation: true,
      createdBy: true,
      ticket: true,
    },
    limit: 100,
  });
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();

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
              <TableHead>Type</TableHead>
              <TableHead>Part</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
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
                      <span className="font-medium">{tx.part.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tx.part.sku}
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
                      <span>{tx.location.name}</span>
                      {tx.type === "transfer" && tx.toLocation && (
                        <span className="text-muted-foreground">
                          → {tx.toLocation.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.ticket ? (
                      <Badge variant="outline">Ticket #{tx.ticket.id}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {tx.reference || "-"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{tx.createdBy.name}</TableCell>
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

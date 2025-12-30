"use client";

import { Badge } from "@/components/ui/badge";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { formatRelativeTime } from "@/lib/utils";
import { MoveDown, MoveUp, RefreshCw, RotateCcw } from "lucide-react";

interface Transaction {
  id: number;
  type: string;
  quantity: number;
  reference: string | null;
  createdAt: Date;
  partName: string | null;
  partSku: string | null;
  locationName: string | null;
  toLocationName: string | null;
  userName: string | null;
  workOrderId: number | null;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  searchParams?: Record<string, string | undefined>;
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

export function TransactionsTable({
  transactions,
  searchParams,
}: TransactionsTableProps) {
  const columns: ColumnDef<Transaction>[] = [
    {
      id: "type",
      header: "Type",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <TransactionIcon type={row.type} />
          <span className="capitalize">{row.type}</span>
        </div>
      ),
    },
    {
      id: "part",
      header: "Part",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.partName}</span>
          <span className="text-xs text-muted-foreground">{row.partSku}</span>
        </div>
      ),
    },
    {
      id: "quantity",
      header: "Quantity",
      sortable: true,
      cell: (row) => (
        <span
          className={
            row.type === "in" || row.type === "adjustment"
              ? "text-emerald-600 font-medium"
              : "text-rose-600 font-medium"
          }
        >
          {row.type === "out" || row.type === "transfer" ? "-" : "+"}
          {row.quantity}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col text-sm">
          <span>{row.locationName}</span>
          {row.type === "transfer" && row.toLocationName && (
            <span className="text-muted-foreground">
              → {row.toLocationName}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "reference",
      header: "Reference",
      sortable: true,
      cell: (row) =>
        row.workOrderId ? (
          <Badge variant="outline">WO #{row.workOrderId}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            {row.reference || "-"}
          </span>
        ),
    },
    {
      id: "user",
      header: "User",
      sortable: true,
      cell: (row) => <span>{row.userName}</span>,
    },
    {
      id: "createdAt",
      header: "Date",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={transactions}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      emptyMessage="No transactions found"
      className="bg-white"
    />
  );
}

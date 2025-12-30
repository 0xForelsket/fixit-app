"use client";

import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import Link from "next/link";

interface Vendor {
  id: number;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
}

interface VendorsTableProps {
  vendors: Vendor[];
  searchParams?: Record<string, string | undefined>;
}

export function VendorsTable({ vendors, searchParams }: VendorsTableProps) {
  const columns: ColumnDef<Vendor>[] = [
    {
      id: "code",
      header: "Code",
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="font-mono text-xs font-medium">{row.code}</span>
      ),
    },
    {
      id: "name",
      header: "Name",
      sortable: true,
      cell: (row) => (
        <Link
          href={`/assets/vendors/${row.id}`}
          className="font-medium hover:underline decoration-primary underline-offset-4"
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: "contactPerson",
      header: "Contact",
      sortable: true,
      hideBelow: "md",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.contactPerson || "—"}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      sortable: true,
      hideBelow: "sm",
      cell: (row) => (
        <span className="text-muted-foreground">{row.phone || "—"}</span>
      ),
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => (
        <span className="text-muted-foreground">{row.email || "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: "80px",
      resizable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          asChild
        >
          <Link href={`/assets/vendors/${row.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={vendors}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      emptyMessage="No vendors found"
      className="bg-white"
    />
  );
}

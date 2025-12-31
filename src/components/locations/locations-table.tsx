"use client";

import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { formatRelativeTime } from "@/lib/utils";
import { ChevronRight, Edit, MapPin } from "lucide-react";
import Link from "next/link";

interface Location {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  parent: { id: number; name: string } | null;
}

interface LocationsTableProps {
  locations: Location[];
  searchParams?: Record<string, string | undefined>;
}

export function LocationsTable({
  locations,
  searchParams,
}: LocationsTableProps) {
  const columns: ColumnDef<Location>[] = [
    {
      id: "name",
      header: "Location",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border shadow-sm">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm font-serif-brand">
              {row.name}
            </p>
            {row.description && (
              <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground line-clamp-1 mt-0.5">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "code",
      header: "Code",
      sortable: true,
      hideBelow: "md",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-muted-foreground uppercase tracking-widest">
          {row.code}
        </span>
      ),
    },
    {
      id: "parent",
      header: "Parent",
      sortable: true,
      hideBelow: "lg",
      cell: (row) =>
        row.parent ? (
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {row.parent.name}
          </div>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 bg-muted/50 px-2 py-1 rounded">
            ROOT
          </span>
        ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-success-700">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-muted-foreground">
            Inactive
          </span>
        ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideBelow: "sm",
      cell: (row) => (
        <span className="text-sm font-mono text-muted-foreground">
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      width: "80px",
      align: "right",
      resizable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground"
        >
          <Link href={`/assets/locations/${row.id}`} aria-label={`Edit ${row.name}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={locations}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      emptyMessage="No locations found"
      className="rounded-2xl shadow-xl shadow-border/20"
    />
  );
}

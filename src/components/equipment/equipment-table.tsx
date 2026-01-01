"use client";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Edit, Flag, MapPin, MonitorCog } from "lucide-react";
import Link from "next/link";

interface EquipmentType {
  id: number;
  name: string;
  category: {
    id: number;
    label: string;
  };
}

interface Equipment {
  id: number;
  code: string;
  name: string;
  status: string;
  location: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
  type: EquipmentType | null;
}

interface EquipmentTableProps {
  equipment: Equipment[];
  searchParams?: Record<string, string | undefined>;
  favoriteIds?: number[];
  userPermissions?: string[];
}

export function EquipmentTable({
  equipment,
  searchParams,
  favoriteIds = [],
  userPermissions = [],
}: EquipmentTableProps) {
  const favoriteSet = new Set(favoriteIds);
  const canEdit = hasPermission(userPermissions, PERMISSIONS.EQUIPMENT_UPDATE);

  const columns: ColumnDef<Equipment>[] = [
    {
      id: "code",
      header: "Code",
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className="font-mono font-bold text-muted-foreground uppercase tracking-widest text-xs">
          {row.code}
        </span>
      ),
    },
    {
      id: "name",
      header: "Equipment / Asset",
      sortable: true,
      cell: (row) => (
        <Link
          href={`/assets/equipment/${row.id}`}
          data-testid="equipment-link"
          className="flex items-center gap-4 group/item"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform group-hover/item:scale-105">
            <MonitorCog className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-foreground group-hover/item:text-primary transition-colors uppercase tracking-tight text-sm font-serif-brand">
              {row.name}
            </p>
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
              ID: {row.id}
            </p>
          </div>
        </Link>
      ),
    },
    {
      id: "classification",
      header: "Classification",
      sortable: true,
      hideBelow: "lg",
      cell: (row) =>
        row.type ? (
          <div className="inline-flex flex-col bg-muted px-2.5 py-1 rounded-md border border-border">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
              {row.type.category.label}
            </span>
            <span className="text-xs font-bold text-foreground/80">
              {row.type.name}
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold text-muted-foreground tracking-widest bg-muted/50 px-2 py-1 rounded-md border border-border">
            UNCLASSIFIED
          </span>
        ),
    },
    {
      id: "location",
      header: "Location",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border w-fit">
          <MapPin className="h-3.5 w-3.5" />
          {row.location?.name || "UNASSIGNED"}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "responsible",
      header: "Responsible",
      sortable: true,
      hideBelow: "xl",
      cell: (row) => (
        <span
          className={cn(
            "text-sm font-bold",
            row.owner?.name
              ? "text-foreground/80"
              : "text-muted-foreground italic"
          )}
        >
          {row.owner?.name || "OFF-SYSTEM"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      width: "140px",
      align: "right",
      resizable: false,
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <FavoriteButton
            entityType="equipment"
            entityId={row.id}
            isFavorited={favoriteSet.has(row.id)}
          />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-xl hover:bg-warning-500 hover:text-white transition-all text-muted-foreground"
            title="Report Issue"
          >
            <Link
              href={`/equipment/${row.code}#report`}
              aria-label={`Report issue for ${row.name}`}
            >
              <Flag className="h-4 w-4" />
            </Link>
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all transform group-hover:rotate-12 text-muted-foreground"
            >
              <Link
                href={`/assets/equipment/${row.id}/edit`}
                aria-label={`Edit ${row.name}`}
              >
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={equipment}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      emptyMessage="No assets identified"
      className="rounded-2xl shadow-xl shadow-border/20"
    />
  );
}

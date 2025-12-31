"use client";

import { Button } from "@/components/ui/button";
import { type ColumnDef, DataTable } from "@/components/ui/data-table";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Edit, Shield, User, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface UserWithRole {
  id: number;
  name: string;
  employeeId: string;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  assignedRole: { id: number; name: string } | null;
}

interface UsersTableProps {
  users: UserWithRole[];
  searchParams?: Record<string, string | undefined>;
}

const roleConfigs: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  operator: {
    icon: User,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  tech: {
    icon: Wrench,
    color: "text-primary-700",
    bg: "bg-primary-500/15",
    border: "border-primary-500/30",
  },
  admin: {
    icon: Shield,
    color: "text-danger-700",
    bg: "bg-danger-500/15",
    border: "border-danger-500/30",
  },
};

export function UsersTable({ users, searchParams }: UsersTableProps) {
  const columns: ColumnDef<UserWithRole>[] = [
    {
      id: "name",
      header: "User",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border shadow-sm">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm font-serif-brand">
              {row.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "employeeId",
      header: "Employee ID",
      sortable: true,
      hideBelow: "md",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-muted-foreground uppercase tracking-widest">
          {row.employeeId}
        </span>
      ),
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      hideBelow: "lg",
      cell: (row) => (
        <span className="text-sm font-medium text-muted-foreground">
          {row.email || "—"}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      cell: (row) => {
        const roleName = row.assignedRole?.name || "operator";
        const roleConfig = roleConfigs[roleName] || roleConfigs.operator;
        const RoleIcon = roleConfig.icon;

        return (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider w-fit shadow-sm",
                roleConfig.bg,
                roleConfig.color,
                roleConfig.border
              )}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              {roleName}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      hideBelow: "sm",
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
      hideBelow: "xl",
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
          <Link href={`/admin/users/${row.id}`} aria-label={`Edit ${row.name}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchParams={searchParams}
      getRowId={(row) => row.id}
      emptyMessage="No users found"
      className="rounded-2xl shadow-xl shadow-border/20"
    />
  );
}

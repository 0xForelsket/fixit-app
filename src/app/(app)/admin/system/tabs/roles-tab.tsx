"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsTicker } from "@/components/ui/stats-ticker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Edit, Plus, Shield, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
  userCount: number;
}

interface RolesTabProps {
  roles: Role[];
  stats: {
    total: number;
    system: number;
    custom: number;
  };
}

export function RolesTab({ roles, stats }: RolesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <StatsTicker
          stats={[
            {
              label: "Total Roles",
              value: stats.total,
              icon: Shield,
              variant: "default",
            },
            {
              label: "System",
              value: stats.system,
              icon: ShieldCheck,
              variant: "primary",
            },
            {
              label: "Custom",
              value: stats.custom,
              icon: Shield,
              variant: "default",
            },
          ]}
        />
        <Button
          asChild
          className="rounded-full font-black text-[10px] uppercase tracking-wider h-10 px-6"
        >
          <Link href="/admin/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      {roles.length === 0 ? (
        <EmptyState
          title="No roles defined"
          description="Create your first role to get started with permission management."
          icon={Shield}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                  Permissions
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Users
                </TableHead>
                <TableHead className="p-4 w-20" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {roles.map((role, index) => (
                <TableRow
                  key={role.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors group",
                    index < 5 && `animate-stagger-${index + 1}`
                  )}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg",
                          role.isSystemRole
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                            : "bg-zinc-900 text-white"
                        )}
                      >
                        {role.isSystemRole ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground uppercase tracking-tight">
                          {role.name}
                        </p>
                        {role.isSystemRole && (
                          <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">
                            SYSTEM
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {role.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="p-4 hidden lg:table-cell">
                    {role.permissions.includes("*") ? (
                      <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">
                        ALL
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                        {role.permissions.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {role.userCount}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="rounded-xl"
                    >
                      <Link href={`/admin/roles/${role.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

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
import { Edit, Plus, Shield, User, Users, Wrench } from "lucide-react";
import Link from "next/link";

interface UserData {
  id: string;
  employeeId: string;
  name: string;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  assignedRole: {
    id: string;
    name: string;
  } | null;
}

interface UsersTabProps {
  users: UserData[];
  stats: {
    total: number;
    active: number;
    operators: number;
    techs: number;
    admins: number;
  };
}

export function UsersTab({ users, stats }: UsersTabProps) {
  return (
    <div className="space-y-6">
      {/* Header row with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            User Management
          </h3>
        </div>
        <Button
          asChild
          className="rounded-full font-black text-[10px] uppercase tracking-wider h-10 px-6"
        >
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <StatsTicker
        stats={[
          {
            label: "Total",
            value: stats.total,
            icon: Users,
            variant: "default",
          },
          {
            label: "Operators",
            value: stats.operators,
            icon: User,
            variant: "default",
          },
          {
            label: "Technicians",
            value: stats.techs,
            icon: Wrench,
            variant: "primary",
          },
          {
            label: "Admins",
            value: stats.admins,
            icon: Shield,
            variant: "danger",
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Add your first user to build your team."
          icon={Users}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                  Employee ID
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="p-4 w-20" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {users.slice(0, 10).map((user, index) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors group",
                    index < 5 && `animate-stagger-${index + 1}`
                  )}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs uppercase">
                        {user.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 hidden md:table-cell">
                    <span className="font-mono text-sm text-muted-foreground">
                      {user.employeeId}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {user.assignedRole?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="rounded-xl"
                    >
                      <Link href={`/admin/users/${user.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length > 10 && (
            <div className="border-t border-border p-4 text-center">
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/admin/users">View all {users.length} users</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { getRoles } from "@/actions/roles";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { DeleteRoleButton } from "./delete-role-button";

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-10 animate-in">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            Role <span className="text-primary-600">Management</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <Shield className="h-3.5 w-3.5" />
            {roles.length} ROLES CONFIGURED
          </div>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/25"
        >
          <Link href="/admin/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            CREATE ROLE
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
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm shadow-xl shadow-zinc-200/20">
          <Table className="w-full text-left border-collapse">
            <TableHeader>
              <TableRow className="border-b border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Role
                </TableHead>
                <TableHead className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden lg:table-cell">
                  Permissions
                </TableHead>
                <TableHead className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Users
                </TableHead>
                <TableHead className="p-5 w-28" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {roles.map((role, index) => {
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";
                return (
                  <TableRow
                    key={role.id}
                    className={cn(
                      "hover:bg-primary-50/30 transition-colors group animate-in fade-in slide-in-from-bottom-1",
                      staggerClass
                    )}
                  >
                    <TableCell className="p-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110",
                            role.isSystemRole
                              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                              : "bg-zinc-900 text-white"
                          )}
                        >
                          {role.isSystemRole ? (
                            <ShieldCheck className="h-6 w-6" />
                          ) : (
                            <Shield className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                            {role.name}
                          </p>
                          {role.isSystemRole && (
                            <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-widest">
                              SYSTEM ROLE
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-5 hidden md:table-cell">
                      <span className="text-sm text-zinc-600">
                        {role.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {role.permissions.includes("*") ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                            ALL PERMISSIONS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-600">
                            {role.permissions.length} PERMISSIONS
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/50 w-fit">
                        <Users className="h-3.5 w-3.5" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell className="p-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="rounded-xl hover:bg-primary-500 hover:text-white transition-all"
                        >
                          <Link href={`/admin/roles/${role.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {!role.isSystemRole && (
                          <DeleteRoleButton
                            roleId={role.id}
                            roleName={role.name}
                            disabled={role.userCount > 0}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

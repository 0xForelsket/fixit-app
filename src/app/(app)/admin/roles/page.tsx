import { getRoles } from "@/actions/roles";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SortHeader } from "@/components/ui/sort-header";
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
import { DeleteRoleButton } from "./delete-role-button";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: "name" | "description" | "userCount";
    dir?: "asc" | "desc";
  }>;
}) {
  const params = await searchParams;
  const roles = await getRoles(params);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Role Management"
        subtitle="Access Control"
        description={`${roles.length} ROLES CONFIGURED`}
        bgSymbol="RO"
        actions={
          <Button
            asChild
            className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Link href="/admin/roles/new">
              <Plus className="mr-2 h-4 w-4" />
              CREATE ROLE
            </Link>
          </Button>
        }
      />

      <StatsTicker
        stats={[
          {
            label: "Total Roles",
            value: roles.length,
            icon: Shield,
            variant: "default",
          },
          {
            label: "System Roles",
            value: roles.filter((r) => r.isSystemRole).length,
            icon: ShieldCheck,
            variant: "primary",
          },
          {
            label: "Custom Roles",
            value: roles.filter((r) => !r.isSystemRole).length,
            icon: Shield,
            variant: "default",
          },
        ]}
      />

      {roles.length === 0 ? (
        <EmptyState
          title="No roles defined"
          description="Create your first role to get started with permission management."
          icon={Shield}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
          <Table className="w-full text-left border-collapse">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border bg-transparent hover:bg-transparent">
                <SortHeader
                  label="Role"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Description"
                  field="description"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell"
                />
                <TableHead className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                  Permissions
                </TableHead>
                <SortHeader
                  label="Users"
                  field="userCount"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <TableHead className="p-5 w-28" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {roles.map((role, index) => {
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";
                return (
                  <TableRow
                    key={role.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors group animate-in fade-in slide-in-from-bottom-1",
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
                          <p className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
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
                      <span className="text-sm text-muted-foreground">
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
                          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                            {role.permissions.length} PERMISSIONS
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border w-fit">
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
                          className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
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
    </PageContainer>
  );
}

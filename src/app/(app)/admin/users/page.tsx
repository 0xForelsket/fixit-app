
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
import { db } from "@/db";
import { users } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { desc } from "drizzle-orm";
import {
  Edit,
  Plus,
  Search,
  Shield,
  Upload,
  User,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

type SearchParams = {
  role?: string;
  search?: string;
  sort?: "name" | "employeeId" | "email" | "role" | "status" | "createdAt";
  dir?: "asc" | "desc";
};

async function getUsers(params: SearchParams) {
  const usersList = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    with: {
      assignedRole: true,
    },
  });

  let filtered = usersList;
  if (params.role && params.role !== "all") {
    filtered = filtered.filter((u) => u.assignedRole?.name === params.role);
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.employeeId.toLowerCase().includes(searchLower)
    );
  }

  if (params.sort) {
    filtered.sort((a, b) => {
      let valA: string | number | boolean = "";
      let valB: string | number | boolean = "";

      switch (params.sort) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "employeeId":
          valA = a.employeeId.toLowerCase();
          valB = b.employeeId.toLowerCase();
          break;
        case "email":
          valA = (a.email || "").toLowerCase();
          valB = (b.email || "").toLowerCase();
          break;
        case "role":
          valA = a.assignedRole?.name || "";
          valB = b.assignedRole?.name || "";
          break;
        case "status":
          valA = a.isActive ? 1 : 0;
          valB = b.isActive ? 1 : 0;
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
      }

      if (valA < valB) return params.dir === "desc" ? 1 : -1;
      if (valA > valB) return params.dir === "desc" ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

async function getUserStats() {
  const allUsers = await db.query.users.findMany({
    with: {
      assignedRole: true,
    },
  });
  return {
    total: allUsers.length,
    operators: allUsers.filter((u) => u.assignedRole?.name === "operator")
      .length,
    techs: allUsers.filter((u) => u.assignedRole?.name === "tech").length,
    admins: allUsers.filter((u) => u.assignedRole?.name === "admin").length,
    active: allUsers.filter((u) => u.isActive).length,
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const usersList = await getUsers(params);
  const stats = await getUserStats();

  const roleConfigs: Record<
    string,
    { icon: React.ElementType; color: string; bg: string; border: string }
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

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="User Directory"
        subtitle="Team Management"
        description={`${stats.total} ACCOUNTS • ${stats.active} ACTIVE`}
        bgSymbol="US"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="rounded-full border-2 font-black text-[10px] uppercase tracking-wider h-11 px-6 hover:bg-muted transition-all"
            >
              <Link href="/admin/import?type=users">
                <Upload className="mr-2 h-4 w-4" />
                BULK IMPORT
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full font-black text-[10px] uppercase tracking-wider h-11 px-8 shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
            >
              <Link href="/admin/users/new">
                <Plus className="mr-2 h-4 w-4" />
                ADD USER
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Ticker */}
      <StatsTicker
        stats={[
          {
            label: "All Users",
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

      {/* Search */}
      <div className="flex items-center gap-3">
        <form className="flex-1 max-w-md" action="/admin/users" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="FILTER BY NAME OR ID..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
            />
            {params.role && (
              <input type="hidden" name="role" value={params.role} />
            )}
          </div>
        </form>
      </div>

      {/* Users Table */}
      {usersList.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            params.search || params.role
              ? "Try adjusting your filters to find what you're looking for."
              : "Add your first user to build your team."
          }
          icon={Users}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-border/20">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <SortHeader
                  label="User"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Employee ID"
                  field="employeeId"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell"
                />
                <SortHeader
                  label="Email"
                  field="email"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell"
                />
                <SortHeader
                  label="Role"
                  field="role"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell"
                />
                <SortHeader
                  label="Created"
                  field="createdAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell"
                />
                <TableHead className="p-5 w-24" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {usersList.map((user, index) => {
                const roleName = user.assignedRole?.name || "operator";
                const roleConfig =
                  roleConfigs[roleName] || roleConfigs.operator;
                const RoleIcon = roleConfig.icon;
                const staggerClass =
                  index < 5
                    ? `animate-stagger-${index + 1}`
                    : "animate-in fade-in duration-500";

                return (
                  <TableRow
                    key={user.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-1",
                      staggerClass
                    )}
                  >
                    <TableCell className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border shadow-sm">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm font-serif-brand">
                            {user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-5 hidden md:table-cell">
                      <span className="font-mono font-bold text-xs text-muted-foreground uppercase tracking-widest">
                        {user.employeeId}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 hidden lg:table-cell">
                      <span className="text-sm font-medium text-muted-foreground">
                        {user.email || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="p-5">
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
                    </TableCell>
                    <TableCell className="p-5 hidden sm:table-cell">
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-success-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-5 hidden xl:table-cell">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatRelativeTime(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="p-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground"
                      >
                        <Link href={`/admin/users/${user.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SortHeader } from "@/components/ui/sort-header";
import { StatsCard } from "@/components/ui/stats-card";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase font-serif-brand">
            User <span className="text-primary">Directory</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            <Users className="h-3.5 w-3.5" />
            {stats.total} ACCOUNTS • {stats.active} ACTIVE
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/import?type=users">
              <Upload className="mr-2 h-4 w-4" />
              BULK IMPORT
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              ADD USER
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Operators"
          value={stats.operators}
          icon={User}
          variant="secondary"
          href="?role=operator"
          active={params.role === "operator"}
          className="animate-stagger-1 animate-in"
        />
        <StatsCard
          title="Technicians"
          value={stats.techs}
          icon={Wrench}
          variant="primary"
          href="?role=tech"
          active={params.role === "tech"}
          className="animate-stagger-2 animate-in"
        />
        <StatsCard
          title="Admins"
          value={stats.admins}
          icon={Shield}
          variant="danger"
          href="?role=admin"
          active={params.role === "admin"}
          className="animate-stagger-3 animate-in"
        />
        <StatsCard
          title="All Users"
          value={stats.total}
          icon={Users}
          variant="success"
          href="/admin/users"
          active={!params.role || params.role === "all"}
          className="animate-stagger-4 animate-in"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <form className="flex-1 max-w-md" action="/admin/users" method="get">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Filter by name or employee ID..."
              defaultValue={params.search}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border text-left text-sm font-medium text-muted-foreground hover:bg-transparent">
                <SortHeader
                  label="User"
                  field="name"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4"
                />
                <SortHeader
                  label="Employee ID"
                  field="employeeId"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden md:table-cell"
                />
                <SortHeader
                  label="Email"
                  field="email"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden lg:table-cell"
                />
                <SortHeader
                  label="Role"
                  field="role"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4"
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden sm:table-cell"
                />
                <SortHeader
                  label="Created"
                  field="createdAt"
                  currentSort={params.sort}
                  currentDir={params.dir}
                  params={params}
                  className="p-4 hidden xl:table-cell"
                />
                <TableHead className="p-4" />
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
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-border text-muted-foreground"
                      >
                        {user.employeeId}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {user.email || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider w-fit",
                            roleConfig.bg,
                            roleConfig.color,
                            roleConfig.border
                          )}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {roleName.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 hidden sm:table-cell">
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/15 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-success-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-muted-foreground/30 bg-muted px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-primary"
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
    </div>
  );
}

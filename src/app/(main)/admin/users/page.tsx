import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortHeader } from "@/components/ui/sort-header";
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
import { Edit, Plus, Search, Shield, User, Users, Wrench } from "lucide-react";
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
    { icon: React.ElementType; color: string; bg: string }
  > = {
    operator: { icon: User, color: "text-slate-700", bg: "bg-slate-50" },
    tech: { icon: Wrench, color: "text-primary-700", bg: "bg-primary-50" },
    admin: { icon: Shield, color: "text-rose-700", bg: "bg-rose-50" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
            User <span className="text-primary-600">Directory</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
            <Users className="h-3.5 w-3.5" />
            {stats.total} ACCOUNTS • {stats.active} ACTIVE
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            ADD USER
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Operators"
          value={stats.operators}
          icon={User}
          color="text-slate-600"
          bg="bg-slate-50"
          href="?role=operator"
          active={params.role === "operator"}
        />
        <StatsCard
          title="Technicians"
          value={stats.techs}
          icon={Wrench}
          color="text-primary-600"
          bg="bg-primary-50"
          href="?role=tech"
          active={params.role === "tech"}
        />
        <StatsCard
          title="Admins"
          value={stats.admins}
          icon={Shield}
          color="text-rose-600"
          bg="bg-rose-50"
          href="?role=admin"
          active={params.role === "admin"}
        />
        <StatsCard
          title="All Users"
          value={stats.total}
          icon={Users}
          color="text-emerald-600"
          bg="bg-emerald-50"
          href="/admin/users"
          active={!params.role || params.role === "all"}
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
              placeholder="Search by name or employee ID..."
              defaultValue={params.search}
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {params.role && (
              <input type="hidden" name="role" value={params.role} />
            )}
          </div>
        </form>
      </div>

      {/* Users Table */}
      {usersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No users found</h3>
          <p className="text-sm text-muted-foreground">
            {params.search || params.role
              ? "Try adjusting your filters"
              : "Add your first user to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b text-left text-sm font-medium text-muted-foreground hover:bg-transparent">
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
            <TableBody className="divide-y">
              {usersList.map((user) => {
                const roleName = user.assignedRole?.name || "operator";
                const roleConfig =
                  roleConfigs[roleName] || roleConfigs.operator;
                const RoleIcon = roleConfig.icon;

                return (
                  <TableRow
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-xs">
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
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit",
                            roleConfig.bg,
                            roleConfig.color
                          )}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {roleName.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 hidden sm:table-cell">
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
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
                      <Button variant="ghost" size="sm" asChild>
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

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  href,
  active,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md bg-white",
        active && "ring-2 ring-primary-500 border-primary-300"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </Link>
  );
}

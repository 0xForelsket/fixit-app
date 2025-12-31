import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLayout } from "@/components/ui/page-layout";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { UserFilters } from "@/components/users/user-filters";
import { UsersTable } from "@/components/users/users-table";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Plus, Shield, Upload, User, Users, Wrench } from "lucide-react";
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

  return (
    <PageLayout
      title="User Directory"
      subtitle="Team Management"
      description={`${stats.total} ACCOUNTS • ${stats.active} ACTIVE`}
      bgSymbol="US"
      headerActions={
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
      stats={
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
      }
      filters={<UserFilters searchParams={params} />}
    >
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
        <UsersTable users={usersList} searchParams={params} />
      )}
    </PageLayout>
  );
}

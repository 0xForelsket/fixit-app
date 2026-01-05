import { getDepartmentsWithStats } from "@/actions/departments";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsTicker } from "@/components/ui/stats-ticker";
import { cn } from "@/lib/utils";
import { ArrowRight, Building2, MonitorCog, Users, Wrench } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Departments | FixIt",
  description: "View all departments, their heads, and team members",
};

export default async function DepartmentsPage() {
  const departments = await getDepartmentsWithStats();

  const totalMembers = departments.reduce((sum, d) => sum + d.memberCount, 0);
  const totalEquipment = departments.reduce(
    (sum, d) => sum + d.equipmentCount,
    0
  );
  const totalActiveWorkOrders = departments.reduce(
    (sum, d) => sum + d.activeWorkOrderCount,
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          View the organizational structure, department heads, and team members.
        </p>
      </div>

      {/* Stats Overview */}
      <StatsTicker
        stats={[
          {
            label: "Departments",
            value: departments.length,
            icon: Building2,
            variant: "primary",
          },
          {
            label: "Total Members",
            value: totalMembers,
            icon: Users,
            variant: "default",
          },
          {
            label: "Equipment",
            value: totalEquipment,
            icon: MonitorCog,
            variant: "default",
          },
          {
            label: "Active Work Orders",
            value: totalActiveWorkOrders,
            icon: Wrench,
            variant: totalActiveWorkOrders > 10 ? "warning" : "default",
          },
        ]}
      />

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Departments help organize users and equipment. Contact an administrator to set them up."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => (
            <Link
              key={dept.id}
              href={`/departments/${dept.id}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                "animate-in fade-in slide-in-from-bottom-2",
                index < 6 && `animate-stagger-${(index % 5) + 1}`
              )}
            >
              {/* Department Code Badge */}
              <div className="absolute right-4 top-4">
                <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary font-mono">
                  {dept.code}
                </span>
              </div>

              {/* Department Icon and Name */}
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {dept.name}
                  </h3>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {dept.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Manager Info */}
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                {dept.managerAvatarUrl ? (
                  <img
                    src={dept.managerAvatarUrl}
                    alt={dept.managerName || "Manager"}
                    className="h-8 w-8 rounded-full object-cover border-2 border-background"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border-2 border-background">
                    {dept.managerName?.slice(0, 2).toUpperCase() || "—"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Department Head
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {dept.managerName || "Not assigned"}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {dept.memberCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Members
                  </p>
                </div>
                <div className="text-center border-x border-border">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <MonitorCog className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {dept.equipmentCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Equipment
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5" />
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-lg font-bold tabular-nums",
                      dept.activeWorkOrderCount > 5 && "text-amber-600"
                    )}
                  >
                    {dept.activeWorkOrderCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Active WOs
                  </p>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

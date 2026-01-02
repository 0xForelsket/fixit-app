import { getDepartmentWithDetails } from "@/actions/departments";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  Mail,
  MonitorCog,
  Phone,
  User,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartmentWithDetails(id);

  if (!department) {
    return { title: "Department Not Found | FixIt" };
  }

  return {
    title: `${department.name} | Departments | FixIt`,
    description: department.description || `View ${department.name} department details`,
  };
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartmentWithDetails(id);

  if (!department) {
    notFound();
  }

  // Department info card component
  const DepartmentInfoCard = (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-lg border border-border">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <span className="rounded-lg bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary font-mono">
              {department.code}
            </span>
            <h2 className="mt-1 text-xl font-bold">{department.name}</h2>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
          <p className="text-2xl font-bold tabular-nums">{department.memberCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Members
          </p>
        </div>
        <div className="p-4 text-center">
          <MonitorCog className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
          <p className="text-2xl font-bold tabular-nums">{department.equipmentCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Equipment
          </p>
        </div>
        <div className="p-4 text-center">
          <ClipboardList className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
          <p className="text-2xl font-bold tabular-nums">{department.workOrderCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Work Orders
          </p>
        </div>
      </div>

      {/* Description */}
      {department.description && (
        <div className="border-t border-border p-4">
          <p className="text-sm text-muted-foreground">{department.description}</p>
        </div>
      )}
    </div>
  );

  // Department head card
  const DepartmentHeadCard = (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
        Department Head
      </h3>
      {department.manager ? (
        <div className="flex items-start gap-3">
          {department.manager.avatarUrl ? (
            <img
              src={department.manager.avatarUrl}
              alt={department.manager.name}
              className="h-14 w-14 rounded-xl object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary border-2 border-primary/20">
              {department.manager.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg">{department.manager.name}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {department.manager.roleName}
            </p>
            {department.manager.email && (
              <a
                href={`mailto:${department.manager.email}`}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Mail className="h-3 w-3" />
                {department.manager.email}
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted border-2 border-dashed border-border">
            <User className="h-6 w-6" />
          </div>
          <p className="text-sm">No manager assigned</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/departments"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{department.code}</p>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="space-y-6 lg:hidden">
        {DepartmentInfoCard}
        {DepartmentHeadCard}

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <MonitorCog className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="workorders">
              <Wrench className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Work Orders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <MembersList members={department.members} />
          </TabsContent>
          <TabsContent value="equipment" className="mt-4">
            <EquipmentList equipment={department.equipment} />
          </TabsContent>
          <TabsContent value="workorders" className="mt-4">
            <WorkOrdersList workOrders={department.workOrders} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {DepartmentInfoCard}
          {DepartmentHeadCard}
        </div>

        {/* Main Content */}
        <div className="col-span-8">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Team Members</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="workorders">Work Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <MembersList members={department.members} />
            </TabsContent>
            <TabsContent value="equipment" className="mt-4">
              <EquipmentList equipment={department.equipment} />
            </TabsContent>
            <TabsContent value="workorders" className="mt-4">
              <WorkOrdersList workOrders={department.workOrders} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Members List Component
function MembersList({
  members,
}: {
  members: Array<{
    id: string;
    name: string;
    employeeId: string;
    email: string | null;
    roleName: string | null;
    avatarUrl: string | null;
    activeWorkOrderCount: number;
  }>;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No team members"
        description="This department doesn't have any members yet."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {members.map((member, index) => (
        <div
          key={member.id}
          className={cn(
            "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
            index < 5 && `animate-stagger-${index + 1}`
          )}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="h-12 w-12 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground border border-border">
              {member.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{member.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">
                {member.employeeId}
              </span>
              {member.roleName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs">
                    {member.roleName}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span className="font-bold">{member.activeWorkOrderCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase">Active WOs</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Equipment List Component
function EquipmentList({
  equipment,
}: {
  equipment: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    locationName: string | null;
  }>;
}) {
  if (equipment.length === 0) {
    return (
      <EmptyState
        icon={MonitorCog}
        title="No equipment"
        description="No equipment is assigned to this department."
      />
    );
  }

  const statusColors: Record<string, string> = {
    operational: "bg-emerald-500",
    maintenance: "bg-amber-500",
    down: "bg-rose-500",
  };

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {equipment.map((item, index) => (
        <Link
          key={item.id}
          href={`/assets/equipment/${item.id}`}
          className={cn(
            "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group",
            index < 5 && `animate-stagger-${index + 1}`
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MonitorCog className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate group-hover:text-primary transition-colors">
              {item.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">
                {item.code}
              </span>
              {item.locationName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{item.locationName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                statusColors[item.status] || "bg-muted"
              )}
            />
            <span className="text-xs font-medium capitalize">{item.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Work Orders List Component
function WorkOrdersList({
  workOrders,
}: {
  workOrders: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: Date;
    assigneeName: string | null;
  }>;
}) {
  if (workOrders.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No work orders"
        description="No work orders are associated with this department."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {workOrders.map((wo, index) => (
        <Link
          key={wo.id}
          href={`/maintenance/work-orders/${wo.id}`}
          className={cn(
            "block p-4 hover:bg-muted/50 transition-colors",
            index < 5 && `animate-stagger-${index + 1}`
          )}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-sm truncate pr-2">{wo.title}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase shrink-0">
              {formatRelativeTime(wo.createdAt)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge status={wo.status} className="text-xs" />
              <Badge
                variant={
                  wo.priority === "critical"
                    ? "danger"
                    : wo.priority === "high"
                      ? "warning"
                      : "outline"
                }
                className="text-xs capitalize"
              >
                {wo.priority}
              </Badge>
            </div>
            <span className="text-muted-foreground italic">
              {wo.assigneeName || "Unassigned"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

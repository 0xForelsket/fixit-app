import { getDepartments } from "@/actions/departments";
import { getRoles } from "@/actions/roles";
import { db } from "@/db";
import {
  equipment,
  maintenanceSchedules,
  roles,
  users,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser, requireAnyPermission } from "@/lib/session";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { SystemTabs } from "./system-tabs";

async function getUsers() {
  return db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    with: {
      assignedRole: true,
    },
  });
}

async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: [desc(equipment.createdAt)],
    with: {
      location: true,
      owner: true,
    },
  });
}

async function getUsersForSelect() {
  return db.query.users.findMany({
    columns: { id: true, name: true },
    where: (users, { eq }) => eq(users.isActive, true),
    orderBy: [desc(users.name)],
  });
}

async function getSchedulerData() {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const schedules = await db.query.maintenanceSchedules.findMany({
    where: eq(maintenanceSchedules.isActive, true),
    with: { equipment: { columns: { name: true } } },
    orderBy: [desc(maintenanceSchedules.nextDue)],
  });

  const formattedSchedules = schedules
    .filter((s) => s.nextDue !== null)
    .map((s) => ({
      id: s.id,
      title: s.title,
      equipmentName: s.equipment?.name || "Unknown Equipment",
      frequencyDays: s.frequencyDays ?? 0,
      nextDue: s.nextDue!,
      lastGenerated: s.lastGenerated,
      isActive: s.isActive,
    }));

  const overdueCount = schedules.filter(
    (s) => s.nextDue && s.nextDue < now
  ).length;
  const upcomingCount = schedules.filter(
    (s) => s.nextDue && s.nextDue >= now && s.nextDue <= oneWeekFromNow
  ).length;

  return {
    schedules: formattedSchedules,
    overdueCount,
    upcomingCount,
  };
}

async function getTechnicianWorkloads() {
  // Get technician role
  const techRole = await db.query.roles.findFirst({
    where: eq(roles.name, "tech"),
  });

  if (!techRole) return [];

  // Get all active technicians with their departments
  const technicians = await db.query.users.findMany({
    where: and(eq(users.roleId, techRole.id), eq(users.isActive, true)),
    columns: { id: true, name: true, departmentId: true },
    with: {
      department: { columns: { name: true } },
    },
  });

  if (technicians.length === 0) return [];

  const now = new Date();

  // Get workload counts for all technicians in a single query
  const workloadData = await db
    .select({
      assignedToId: workOrders.assignedToId,
      openCount:
        sql<number>`cast(count(case when ${workOrders.status} = 'open' then 1 end) as integer)`.as(
          "open_count"
        ),
      inProgressCount:
        sql<number>`cast(count(case when ${workOrders.status} = 'in_progress' then 1 end) as integer)`.as(
          "in_progress_count"
        ),
      criticalCount:
        sql<number>`cast(count(case when ${workOrders.priority} = 'critical' and ${workOrders.status} in ('open', 'in_progress') then 1 end) as integer)`.as(
          "critical_count"
        ),
      overdueCount:
        sql<number>`cast(count(case when ${workOrders.dueBy} < ${now.toISOString()} and ${workOrders.status} in ('open', 'in_progress') then 1 end) as integer)`.as(
          "overdue_count"
        ),
    })
    .from(workOrders)
    .where(
      and(
        inArray(
          workOrders.assignedToId,
          technicians.map((t) => t.id)
        ),
        or(eq(workOrders.status, "open"), eq(workOrders.status, "in_progress"))
      )
    )
    .groupBy(workOrders.assignedToId);

  // Create a map of workload by technician ID
  const workloadMap = new Map(workloadData.map((w) => [w.assignedToId, w]));

  // Combine technician info with workload data
  return technicians.map((tech) => {
    const workload = workloadMap.get(tech.id);
    return {
      id: tech.id,
      name: tech.name,
      departmentName: tech.department?.name || null,
      openCount: Number(workload?.openCount || 0),
      inProgressCount: Number(workload?.inProgressCount || 0),
      criticalCount: Number(workload?.criticalCount || 0),
      overdueCount: Number(workload?.overdueCount || 0),
    };
  });
}

export default async function SystemPage() {
  // Check if user has any admin-related permission
  const currentUser = await getCurrentUser();
  await requireAnyPermission([
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.SYSTEM_QR_CODES,
    PERMISSIONS.SYSTEM_SCHEDULER,
  ]);

  // Check if user can edit departments (admin only)
  const canEditDepartments = currentUser
    ? hasPermission(currentUser.permissions, PERMISSIONS.SYSTEM_SETTINGS)
    : false;

  // Fetch all data in parallel
  const [
    usersList,
    rolesList,
    equipmentList,
    departmentsList,
    usersForSelect,
    schedulerData,
    technicianWorkloads,
  ] = await Promise.all([
    getUsers(),
    getRoles({}),
    getEquipment(),
    getDepartments({}),
    getUsersForSelect(),
    getSchedulerData(),
    getTechnicianWorkloads(),
  ]);

  // Get base URL for QR codes
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Calculate stats
  const userStats = {
    total: usersList.length,
    active: usersList.filter((u) => u.isActive).length,
    operators: usersList.filter((u) => u.assignedRole?.name === "operator")
      .length,
    techs: usersList.filter((u) => u.assignedRole?.name === "tech").length,
    admins: usersList.filter((u) => u.assignedRole?.name === "admin").length,
  };

  const roleStats = {
    total: rolesList.length,
    system: rolesList.filter((r) => r.isSystemRole).length,
    custom: rolesList.filter((r) => !r.isSystemRole).length,
  };

  return (
    <SystemTabs
      users={usersList}
      userStats={userStats}
      roles={rolesList}
      roleStats={roleStats}
      equipment={equipmentList}
      baseUrl={baseUrl}
      departments={departmentsList}
      usersForSelect={usersForSelect}
      canEditDepartments={canEditDepartments}
      schedulerData={schedulerData}
      technicianWorkloads={technicianWorkloads}
    />
  );
}

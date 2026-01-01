import { getDepartments } from "@/actions/departments";
import { getRoles } from "@/actions/roles";
import { db } from "@/db";
import { equipment, maintenanceSchedules, users } from "@/db/schema";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser, requireAnyPermission } from "@/lib/session";
import { and, desc, eq, gte, lt } from "drizzle-orm";
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

  const formattedSchedules = schedules.map((s) => ({
    id: s.id,
    title: s.title,
    equipmentName: s.equipment?.name || "Unknown Equipment",
    frequencyDays: s.frequencyDays,
    nextDue: s.nextDue,
    lastGenerated: s.lastGenerated,
    isActive: s.isActive,
  }));

  const overdueCount = schedules.filter((s) => s.nextDue < now).length;
  const upcomingCount = schedules.filter(
    (s) => s.nextDue >= now && s.nextDue <= oneWeekFromNow
  ).length;

  return {
    schedules: formattedSchedules,
    overdueCount,
    upcomingCount,
  };
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
  const [usersList, roles, equipmentList, departmentsList, usersForSelect, schedulerData] =
    await Promise.all([
      getUsers(),
      getRoles({}),
      getEquipment(),
      getDepartments({}),
      getUsersForSelect(),
      getSchedulerData(),
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
    total: roles.length,
    system: roles.filter((r) => r.isSystemRole).length,
    custom: roles.filter((r) => !r.isSystemRole).length,
  };

  return (
    <SystemTabs
      users={usersList}
      userStats={userStats}
      roles={roles}
      roleStats={roleStats}
      equipment={equipmentList}
      baseUrl={baseUrl}
      departments={departmentsList}
      usersForSelect={usersForSelect}
      canEditDepartments={canEditDepartments}
      schedulerData={schedulerData}
    />
  );
}

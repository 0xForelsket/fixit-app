import { getRoles } from "@/actions/roles";
import { db } from "@/db";
import { equipment, users } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requireAnyPermission } from "@/lib/session";
import { desc } from "drizzle-orm";
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

export default async function SystemPage() {
  // Check if user has any admin-related permission
  await requireAnyPermission([
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.SYSTEM_QR_CODES,
  ]);

  // Fetch all data in parallel
  const [usersList, roles, equipmentList] = await Promise.all([
    getUsers(),
    getRoles({}),
    getEquipment(),
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
    />
  );
}

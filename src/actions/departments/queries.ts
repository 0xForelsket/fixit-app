"use server";

import { db } from "@/db";
import {
  attachments,
  departments,
  equipment,
  locations,
  roles,
  users,
  workOrders,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";

export async function getDepartments(params?: {
  sort?: "name" | "code" | "memberCount";
  dir?: "asc" | "desc";
}) {
  const orderBy = [];
  if (params?.sort) {
    const direction = params.dir === "asc" ? asc : desc;
    switch (params.sort) {
      case "name":
        orderBy.push(direction(departments.name));
        break;
      case "code":
        orderBy.push(direction(departments.code));
        break;
      case "memberCount":
        orderBy.push(
          direction(
            sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`
          )
        );
        break;
    }
  }

  if (orderBy.length === 0) {
    orderBy.push(asc(departments.name));
  }

  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)`,
      equipmentCount: sql<number>`(SELECT COUNT(*) FROM equipment WHERE equipment.department_id = departments.id)`,
    })
    .from(departments)
    .orderBy(...orderBy);

  // Get manager names
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is string => id !== null);

  const managers =
    managerIds.length > 0
      ? await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, managerIds),
          columns: { id: true, name: true },
        })
      : [];

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
  }));
}

export async function getDepartment(id: string) {
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
    with: {
      manager: {
        columns: { id: true, name: true },
      },
    },
  });

  return department ?? null;
}

/**
 * Get all departments with stats for the public listing page
 */
export async function getDepartmentsWithStats() {
  const departmentsList = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerId: departments.managerId,
      memberCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.department_id = departments.id)::int`,
      equipmentCount: sql<number>`(SELECT COUNT(*) FROM equipment WHERE equipment.department_id = departments.id)::int`,
      activeWorkOrderCount: sql<number>`(SELECT COUNT(*) FROM work_orders WHERE work_orders.department_id = departments.id AND work_orders.status IN ('open', 'in_progress'))::int`,
    })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));

  // Get manager info with avatars
  const managerIds = departmentsList
    .map((d) => d.managerId)
    .filter((id): id is string => id !== null);

  if (managerIds.length === 0) {
    return departmentsList.map((dept) => ({
      ...dept,
      managerName: null,
      managerAvatarUrl: null,
    }));
  }

  const managers = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, managerIds));

  // Get avatar URLs for managers
  const managerAvatars = await db
    .select({
      entityId: attachments.entityId,
      s3Key: attachments.s3Key,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.entityType, "user"),
        eq(attachments.type, "avatar"),
        inArray(attachments.entityId, managerIds)
      )
    );

  const managerMap = new Map(managers.map((m) => [m.id, m.name]));
  const avatarMap = new Map(
    managerAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );

  return departmentsList.map((dept) => ({
    ...dept,
    managerName: dept.managerId ? managerMap.get(dept.managerId) || null : null,
    managerAvatarUrl: dept.managerId
      ? avatarMap.get(dept.managerId) || null
      : null,
  }));
}

/**
 * Get full department details with members, equipment, and work orders
 * Optimized with parallelized queries to minimize DB round-trips
 */
export async function getDepartmentWithDetails(id: string) {
  // Get department base info
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    return null;
  }

  // Phase 1: Fetch members and manager in parallel (independent queries)
  const [membersData, managerData] = await Promise.all([
    // Get department members with roles
    db
      .select({
        id: users.id,
        name: users.name,
        employeeId: users.employeeId,
        email: users.email,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.departmentId, id), eq(users.isActive, true)))
      .orderBy(asc(users.name)),

    // Get manager with role (if exists)
    department.managerId
      ? db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            roleName: roles.name,
          })
          .from(users)
          .leftJoin(roles, eq(users.roleId, roles.id))
          .where(eq(users.id, department.managerId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const memberIds = membersData.map((m) => m.id);

  // Phase 2: Fetch all related data in parallel (depends on memberIds)
  const [
    memberAvatars,
    memberWorkOrderCounts,
    equipmentData,
    workOrdersData,
    managerAvatar,
  ] = await Promise.all([
    // Get avatars for all members
    memberIds.length > 0
      ? db
          .select({
            entityId: attachments.entityId,
            s3Key: attachments.s3Key,
          })
          .from(attachments)
          .where(
            and(
              eq(attachments.entityType, "user"),
              eq(attachments.type, "avatar"),
              inArray(attachments.entityId, memberIds)
            )
          )
      : Promise.resolve([]),

    // Get active work order counts per member
    memberIds.length > 0
      ? db
          .select({
            assignedToId: workOrders.assignedToId,
            count: sql<number>`count(*)::int`,
          })
          .from(workOrders)
          .where(
            and(
              inArray(workOrders.assignedToId, memberIds),
              or(
                eq(workOrders.status, "open"),
                eq(workOrders.status, "in_progress")
              )
            )
          )
          .groupBy(workOrders.assignedToId)
      : Promise.resolve([]),

    // Get equipment assigned to department
    db
      .select({
        id: equipment.id,
        name: equipment.name,
        code: equipment.code,
        status: equipment.status,
        locationName: locations.name,
      })
      .from(equipment)
      .leftJoin(locations, eq(equipment.locationId, locations.id))
      .where(eq(equipment.departmentId, id))
      .orderBy(asc(equipment.name))
      .limit(50),

    // Get recent work orders for this department
    db
      .select({
        id: workOrders.id,
        title: workOrders.title,
        status: workOrders.status,
        priority: workOrders.priority,
        createdAt: workOrders.createdAt,
        assignedToId: workOrders.assignedToId,
      })
      .from(workOrders)
      .where(eq(workOrders.departmentId, id))
      .orderBy(desc(workOrders.createdAt))
      .limit(20),

    // Get manager avatar
    department.managerId
      ? db
          .select({ s3Key: attachments.s3Key })
          .from(attachments)
          .where(
            and(
              eq(attachments.entityType, "user"),
              eq(attachments.type, "avatar"),
              eq(attachments.entityId, department.managerId)
            )
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  // Build manager object
  let manager = null;
  if (managerData.length > 0) {
    manager = {
      ...managerData[0],
      avatarUrl:
        managerAvatar.length > 0
          ? `/api/attachments/${managerAvatar[0].s3Key}`
          : null,
    };
  }

  // Build lookup maps for efficient member enrichment
  const avatarMap = new Map(
    memberAvatars.map((a) => [a.entityId, `/api/attachments/${a.s3Key}`])
  );
  const woCountMap = new Map(
    memberWorkOrderCounts.map((c) => [c.assignedToId, c.count])
  );

  const members = membersData.map((m) => ({
    ...m,
    avatarUrl: avatarMap.get(m.id) || null,
    activeWorkOrderCount: woCountMap.get(m.id) || 0,
  }));

  // Phase 3: Fetch assignee names for work orders (depends on workOrdersData)
  const assigneeIds = workOrdersData
    .map((wo) => wo.assignedToId)
    .filter((assigneeId): assigneeId is string => assigneeId !== null);

  const assignees =
    assigneeIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, assigneeIds))
      : [];

  const assigneeMap = new Map(assignees.map((a) => [a.id, a.name]));

  const workOrdersList = workOrdersData.map((wo) => ({
    id: wo.id,
    title: wo.title,
    status: wo.status,
    priority: wo.priority,
    createdAt: wo.createdAt,
    assigneeName: wo.assignedToId
      ? assigneeMap.get(wo.assignedToId) || null
      : null,
  }));

  // Get counts
  const memberCount = members.length;
  const equipmentCount = equipmentData.length;
  const workOrderCount = workOrdersData.length;

  return {
    ...department,
    manager,
    members,
    equipment: equipmentData,
    workOrders: workOrdersList,
    memberCount,
    equipmentCount,
    workOrderCount,
  };
}

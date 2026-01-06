import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { and, asc, count, eq, like, or } from "drizzle-orm";

// ==================== Types ====================

export interface UserFilters {
  roleId?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// ==================== User Queries ====================

/**
 * Get paginated users with filters
 */
export async function getUsers(
  filters: UserFilters = {},
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filters.roleId) {
    conditions.push(eq(users.roleId, filters.roleId));
  }

  if (filters.departmentId) {
    conditions.push(eq(users.departmentId, filters.departmentId));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(users.isActive, filters.isActive));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(users.name, searchPattern),
        like(users.employeeId, searchPattern),
        like(users.email, searchPattern)
      )
    );
  }

  const [items, totalResult] = await Promise.all([
    db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        assignedRole: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true } },
      },
      orderBy: [asc(users.name)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: count() })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  return {
    items,
    total: totalResult[0]?.count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalResult[0]?.count || 0) / pageSize),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      assignedRole: true,
      department: true,
    },
  });
}

/**
 * Get user by employee ID
 */
export async function getUserByEmployeeId(employeeId: string) {
  return db.query.users.findFirst({
    where: eq(users.employeeId, employeeId),
    with: {
      assignedRole: true,
      department: true,
    },
  });
}

/**
 * Get users for dropdown selection
 */
export async function getUsersForSelect(departmentId?: string) {
  const condition = departmentId
    ? and(eq(users.departmentId, departmentId), eq(users.isActive, true))
    : eq(users.isActive, true);

  return db.query.users.findMany({
    where: condition,
    columns: { id: true, name: true, employeeId: true },
    orderBy: [asc(users.name)],
  });
}

/**
 * Get technicians (users with tech role)
 */
export async function getTechnicians(departmentId?: string) {
  const techRole = await db.query.roles.findFirst({
    where: eq(roles.name, "tech"),
  });

  if (!techRole) return [];

  const conditions = [eq(users.roleId, techRole.id), eq(users.isActive, true)];

  if (departmentId) {
    conditions.push(eq(users.departmentId, departmentId));
  }

  return db.query.users.findMany({
    where: and(...conditions),
    columns: { id: true, name: true, employeeId: true },
    orderBy: [asc(users.name)],
  });
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const [totalCount, activeCount, adminCount, techCount] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
    db.query.roles
      .findFirst({ where: eq(roles.name, "admin") })
      .then(async (role) =>
        role
          ? db
              .select({ count: count() })
              .from(users)
              .where(and(eq(users.roleId, role.id), eq(users.isActive, true)))
          : [{ count: 0 }]
      ),
    db.query.roles
      .findFirst({ where: eq(roles.name, "tech") })
      .then(async (role) =>
        role
          ? db
              .select({ count: count() })
              .from(users)
              .where(and(eq(users.roleId, role.id), eq(users.isActive, true)))
          : [{ count: 0 }]
      ),
  ]);

  return {
    total: totalCount[0]?.count || 0,
    active: activeCount[0]?.count || 0,
    admins: adminCount[0]?.count || 0,
    technicians: techCount[0]?.count || 0,
  };
}

// ==================== User Mutations ====================

export interface CreateUserData {
  employeeId: string;
  name: string;
  pin: string;
  email?: string | null;
  roleId?: string | null;
  departmentId?: string | null;
  hourlyRate?: number | null;
  isActive?: boolean;
}

/**
 * Create user
 */
export async function createUserRecord(data: CreateUserData) {
  const [user] = await db
    .insert(users)
    .values({
      ...data,
      isActive: data.isActive ?? true,
    })
    .returning();

  return user;
}

/**
 * Update user
 */
export async function updateUserRecord(
  id: string,
  data: Partial<CreateUserData>
) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return updated;
}

/**
 * Deactivate user
 */
export async function deactivateUser(id: string) {
  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return updated;
}

/**
 * Activate user
 */
export async function activateUser(id: string) {
  const [updated] = await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return updated;
}

// ==================== Roles ====================

/**
 * Get all roles
 */
export async function getRoles() {
  return db.query.roles.findMany({
    orderBy: [asc(roles.name)],
  });
}

/**
 * Get role by ID
 */
export async function getRoleById(id: string) {
  return db.query.roles.findFirst({
    where: eq(roles.id, id),
  });
}

/**
 * Get role by name
 */
export async function getRoleByName(name: string) {
  return db.query.roles.findFirst({
    where: eq(roles.name, name),
  });
}

/**
 * Create role
 */
export async function createRoleRecord(data: {
  name: string;
  description?: string | null;
  permissions: string[];
}) {
  const [role] = await db.insert(roles).values(data).returning();
  return role;
}

/**
 * Update role
 */
export async function updateRoleRecord(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    permissions: string[];
  }>
) {
  const [updated] = await db
    .update(roles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning();

  return updated;
}

/**
 * Delete role
 */
export async function deleteRoleRecord(id: string) {
  await db.delete(roles).where(eq(roles.id, id));
}

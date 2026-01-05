/**
 * Permission-based access control. Pattern: "resource:action"
 * Special permission "*" grants all permissions (superadmin).
 */

export const PERMISSIONS = {
  TICKET_CREATE: "ticket:create",
  TICKET_VIEW: "ticket:view",
  TICKET_VIEW_ALL: "ticket:view_all",
  TICKET_UPDATE: "ticket:update",
  TICKET_RESOLVE: "ticket:resolve",
  TICKET_CLOSE: "ticket:close",
  TICKET_ASSIGN: "ticket:assign",

  EQUIPMENT_VIEW: "equipment:view",
  EQUIPMENT_CREATE: "equipment:create",
  EQUIPMENT_UPDATE: "equipment:update",
  EQUIPMENT_DELETE: "equipment:delete",
  EQUIPMENT_MANAGE_MODELS: "equipment:manage_models",
  EQUIPMENT_FINANCIALS_VIEW: "equipment:financials:view",
  EQUIPMENT_METERS_RECORD: "equipment:meters:record",
  EQUIPMENT_DOWNTIME_REPORT: "equipment:downtime:report",
  EQUIPMENT_ATTACHMENT_DELETE: "equipment:attachment:delete",

  LOCATION_VIEW: "location:view",
  LOCATION_CREATE: "location:create",
  LOCATION_UPDATE: "location:update",
  LOCATION_DELETE: "location:delete",

  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  INVENTORY_VIEW: "inventory:view",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",
  INVENTORY_RECEIVE_STOCK: "inventory:receive_stock",
  INVENTORY_USE_PARTS: "inventory:use_parts",

  MAINTENANCE_VIEW: "maintenance:view",
  MAINTENANCE_CREATE: "maintenance:create",
  MAINTENANCE_UPDATE: "maintenance:update",
  MAINTENANCE_DELETE: "maintenance:delete",
  MAINTENANCE_COMPLETE_CHECKLIST: "maintenance:complete_checklist",

  ANALYTICS_VIEW: "analytics:view",
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_QR_CODES: "system:qr_codes",
  SYSTEM_SCHEDULER: "system:scheduler",

  ALL: "*",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  operator: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.LOCATION_VIEW,
  ],

  tech: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_VIEW_ALL,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_RESOLVE,
    PERMISSIONS.TICKET_CLOSE,
    PERMISSIONS.EQUIPMENT_VIEW,
    PERMISSIONS.EQUIPMENT_METERS_RECORD,
    PERMISSIONS.EQUIPMENT_DOWNTIME_REPORT,
    PERMISSIONS.LOCATION_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_USE_PARTS,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_COMPLETE_CHECKLIST,
  ],

  admin: [PERMISSIONS.ALL],
};

export const LEGACY_ROLES = ["operator", "tech", "admin"] as const;
export type LegacyRole = (typeof LEGACY_ROLES)[number];

export function getLegacyRolePermissions(role: LegacyRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

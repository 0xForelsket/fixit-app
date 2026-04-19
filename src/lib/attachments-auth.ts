import { db } from "@/db";
import {
  type EntityType,
  attachments,
  equipment,
  locations,
  spareParts,
  users,
  vendors,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import type { SessionUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export type AttachmentAccessAction = "view" | "upload" | "delete";

export type AttachmentRecord = typeof attachments.$inferSelect;

type AttachmentAccessResult = {
  allowed: boolean;
  exists: boolean;
  attachment?: AttachmentRecord;
  entityType?: EntityType;
  entityId?: string;
};

type ParentEntity =
  | {
      type: "work_order";
      entity: {
        id: string;
        reportedById: string;
        assignedToId: string | null;
      };
    }
  | {
      type: "equipment";
      entity: {
        id: string;
      };
    }
  | {
      type: "user";
      entity: {
        id: string;
      };
    }
  | {
      type: "location";
      entity: {
        id: string;
      };
    }
  | {
      type: "vendor";
      entity: {
        id: string;
      };
    }
  | {
      type: "spare_part";
      entity: {
        id: string;
      };
    };

async function getParentEntity(
  entityType: EntityType,
  entityId: string
): Promise<ParentEntity | null> {
  switch (entityType) {
    case "work_order": {
      const entity = await db.query.workOrders.findFirst({
        where: eq(workOrders.id, entityId),
        columns: {
          id: true,
          reportedById: true,
          assignedToId: true,
        },
      });
      return entity ? { type: "work_order", entity } : null;
    }
    case "equipment": {
      const entity = await db.query.equipment.findFirst({
        where: eq(equipment.id, entityId),
        columns: { id: true },
      });
      return entity ? { type: "equipment", entity } : null;
    }
    case "user": {
      const entity = await db.query.users.findFirst({
        where: eq(users.id, entityId),
        columns: { id: true },
      });
      return entity ? { type: "user", entity } : null;
    }
    case "location": {
      const entity = await db.query.locations.findFirst({
        where: eq(locations.id, entityId),
        columns: { id: true },
      });
      return entity ? { type: "location", entity } : null;
    }
    case "vendor": {
      const entity = await db.query.vendors.findFirst({
        where: eq(vendors.id, entityId),
        columns: { id: true },
      });
      return entity ? { type: "vendor", entity } : null;
    }
    case "spare_part": {
      const entity = await db.query.spareParts.findFirst({
        where: eq(spareParts.id, entityId),
        columns: { id: true },
      });
      return entity ? { type: "spare_part", entity } : null;
    }
    default:
      return null;
  }
}

function canViewWorkOrder(
  user: SessionUser,
  workOrder: ParentEntity & { type: "work_order" }
): boolean {
  if (userHasPermission(user, PERMISSIONS.TICKET_VIEW_ALL)) {
    return true;
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_VIEW)) {
    return false;
  }

  return (
    workOrder.entity.reportedById === user.id ||
    workOrder.entity.assignedToId === user.id
  );
}

function canUploadToWorkOrder(
  user: SessionUser,
  workOrder: ParentEntity & { type: "work_order" }
): boolean {
  return (
    canViewWorkOrder(user, workOrder) ||
    userHasPermission(user, PERMISSIONS.TICKET_UPDATE)
  );
}

function canDeleteFromWorkOrder(
  user: SessionUser,
  workOrder: ParentEntity & { type: "work_order" }
): boolean {
  return (
    canViewWorkOrder(user, workOrder) &&
    userHasPermission(user, PERMISSIONS.TICKET_UPDATE)
  );
}

function isAuthorizedForParentEntity(
  user: SessionUser,
  parent: ParentEntity,
  action: AttachmentAccessAction
): boolean {
  switch (parent.type) {
    case "work_order":
      switch (action) {
        case "view":
          return canViewWorkOrder(user, parent);
        case "upload":
          return canUploadToWorkOrder(user, parent);
        case "delete":
          return canDeleteFromWorkOrder(user, parent);
      }
      return false;
    case "equipment":
      if (action === "view") {
        return userHasPermission(user, PERMISSIONS.EQUIPMENT_VIEW);
      }
      if (action === "upload") {
        return userHasPermission(user, PERMISSIONS.EQUIPMENT_UPDATE);
      }
      return (
        userHasPermission(user, PERMISSIONS.EQUIPMENT_UPDATE) ||
        userHasPermission(user, PERMISSIONS.EQUIPMENT_ATTACHMENT_DELETE)
      );
    case "user":
      if (action === "view") {
        return (
          parent.entity.id === user.id ||
          userHasPermission(user, PERMISSIONS.USER_VIEW)
        );
      }
      return (
        parent.entity.id === user.id ||
        userHasPermission(user, PERMISSIONS.USER_UPDATE)
      );
    case "location":
      if (action === "view") {
        return userHasPermission(user, PERMISSIONS.LOCATION_VIEW);
      }
      return userHasPermission(user, PERMISSIONS.LOCATION_UPDATE);
    case "vendor":
    case "spare_part":
      if (action === "view") {
        return userHasPermission(user, PERMISSIONS.INVENTORY_VIEW);
      }
      return userHasPermission(user, PERMISSIONS.INVENTORY_UPDATE);
    default:
      return false;
  }
}

export async function authorizeAttachmentEntityAccess(params: {
  user: SessionUser;
  entityType: EntityType;
  entityId: string;
  action: AttachmentAccessAction;
}): Promise<AttachmentAccessResult> {
  const parent = await getParentEntity(params.entityType, params.entityId);

  if (!parent) {
    return {
      allowed: false,
      exists: false,
      entityType: params.entityType,
      entityId: params.entityId,
    };
  }

  return {
    allowed: isAuthorizedForParentEntity(params.user, parent, params.action),
    exists: true,
    entityType: params.entityType,
    entityId: params.entityId,
  };
}

export async function authorizeAttachmentAccessById(params: {
  user: SessionUser;
  attachmentId: string;
  action: AttachmentAccessAction;
}): Promise<AttachmentAccessResult> {
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, params.attachmentId),
  });

  if (!attachment) {
    return { allowed: false, exists: false };
  }

  const baseAction = params.action === "delete" ? "view" : params.action;
  const access = await authorizeAttachmentEntityAccess({
    user: params.user,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    action: baseAction,
  });

  if (!access.allowed) {
    return {
      ...access,
      attachment,
      exists: true,
    };
  }

  if (
    params.action === "delete" &&
    attachment.uploadedById !== params.user.id
  ) {
    const deleteAccess = await authorizeAttachmentEntityAccess({
      user: params.user,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      action: "delete",
    });

    return {
      ...deleteAccess,
      attachment,
      exists: true,
    };
  }

  return {
    allowed: true,
    exists: true,
    attachment,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
  };
}

export async function authorizeAttachmentAccessByKey(params: {
  user: SessionUser;
  key: string;
}): Promise<AttachmentAccessResult> {
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.s3Key, params.key),
  });

  if (!attachment) {
    return { allowed: false, exists: false };
  }

  const access = await authorizeAttachmentEntityAccess({
    user: params.user,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    action: "view",
  });

  return {
    ...access,
    attachment,
    exists: true,
  };
}

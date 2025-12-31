"use server";

import { db } from "@/db";
import {
  equipment as equipmentTable,
  workOrderTemplates,
  workOrders,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import type { ActionResult } from "@/lib/types/actions";
import {
  createWorkOrderTemplateSchema,
  updateWorkOrderTemplateSchema,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getWorkOrderTemplates() {
  const templates = await db.query.workOrderTemplates.findMany({
    where: eq(workOrderTemplates.isActive, true),
    with: {
      department: true,
      defaultAssignedTo: true,
      createdBy: true,
    },
    orderBy: (templates, { asc }) => [asc(templates.name)],
  });

  return templates;
}

export async function getWorkOrderTemplateById(id: number) {
  const template = await db.query.workOrderTemplates.findFirst({
    where: eq(workOrderTemplates.id, id),
    with: {
      department: true,
      defaultAssignedTo: true,
      createdBy: true,
    },
  });

  return template;
}

export async function createWorkOrderTemplate(
  _prevState: ActionResult<{ id: number }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: number }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.MAINTENANCE_CREATE)) {
    return {
      success: false,
      error: "You don't have permission to create templates",
    };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    type: formData.get("type"),
    priority: formData.get("priority") || "medium",
    defaultTitle: formData.get("defaultTitle") || null,
    defaultDescription: formData.get("defaultDescription") || null,
    defaultAssignedToId: formData.get("defaultAssignedToId")
      ? Number(formData.get("defaultAssignedToId"))
      : null,
    departmentId: formData.get("departmentId")
      ? Number(formData.get("departmentId"))
      : null,
    estimatedMinutes: formData.get("estimatedMinutes")
      ? Number(formData.get("estimatedMinutes"))
      : null,
    isActive: formData.get("isActive") !== "false",
  };

  const result = createWorkOrderTemplateSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { success: false, error: firstError || "Invalid input" };
  }

  try {
    const [template] = await db
      .insert(workOrderTemplates)
      .values({
        ...result.data,
        createdById: user.id,
      })
      .returning();

    revalidatePath("/maintenance/templates");

    return { success: true, data: { id: template.id } };
  } catch (error) {
    console.error("Failed to create template:", error);
    return {
      success: false,
      error: "Failed to create template. Please try again.",
    };
  }
}

export async function updateWorkOrderTemplate(
  id: number,
  _prevState: ActionResult<void> | undefined,
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.MAINTENANCE_UPDATE)) {
    return {
      success: false,
      error: "You don't have permission to update templates",
    };
  }

  const existingTemplate = await db.query.workOrderTemplates.findFirst({
    where: eq(workOrderTemplates.id, id),
  });

  if (!existingTemplate) {
    return { success: false, error: "Template not found" };
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    type: formData.get("type"),
    priority: formData.get("priority") || "medium",
    defaultTitle: formData.get("defaultTitle") || null,
    defaultDescription: formData.get("defaultDescription") || null,
    defaultAssignedToId: formData.get("defaultAssignedToId")
      ? Number(formData.get("defaultAssignedToId"))
      : null,
    departmentId: formData.get("departmentId")
      ? Number(formData.get("departmentId"))
      : null,
    estimatedMinutes: formData.get("estimatedMinutes")
      ? Number(formData.get("estimatedMinutes"))
      : null,
    isActive: formData.get("isActive") !== "false",
  };

  const result = updateWorkOrderTemplateSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { success: false, error: firstError || "Invalid input" };
  }

  try {
    await db
      .update(workOrderTemplates)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(workOrderTemplates.id, id));

    revalidatePath("/maintenance/templates");
    revalidatePath(`/maintenance/templates/${id}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update template:", error);
    return {
      success: false,
      error: "Failed to update template. Please try again.",
    };
  }
}

export async function deleteWorkOrderTemplate(
  id: number
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.MAINTENANCE_DELETE)) {
    return {
      success: false,
      error: "You don't have permission to delete templates",
    };
  }

  const existingTemplate = await db.query.workOrderTemplates.findFirst({
    where: eq(workOrderTemplates.id, id),
  });

  if (!existingTemplate) {
    return { success: false, error: "Template not found" };
  }

  try {
    // Soft delete by setting isActive to false
    await db
      .update(workOrderTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(workOrderTemplates.id, id));

    revalidatePath("/maintenance/templates");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete template:", error);
    return {
      success: false,
      error: "Failed to delete template. Please try again.",
    };
  }
}

export async function createWorkOrderFromTemplate(
  templateId: number,
  equipmentId: number
): Promise<ActionResult<{ id: number }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_CREATE)) {
    return {
      success: false,
      error: "You don't have permission to create work orders",
    };
  }

  // Get the template
  const template = await db.query.workOrderTemplates.findFirst({
    where: eq(workOrderTemplates.id, templateId),
  });

  if (!template) {
    return { success: false, error: "Template not found" };
  }

  if (!template.isActive) {
    return { success: false, error: "Template is inactive" };
  }

  // Get the equipment
  const equipment = await db.query.equipment.findFirst({
    where: eq(equipmentTable.id, equipmentId),
  });

  if (!equipment) {
    return { success: false, error: "Equipment not found" };
  }

  // Calculate SLA due date
  const dueBy = calculateDueBy(template.priority);

  try {
    const [workOrder] = await db
      .insert(workOrders)
      .values({
        equipmentId,
        type: template.type,
        title: template.defaultTitle || template.name,
        description: template.defaultDescription || `Created from template: ${template.name}`,
        priority: template.priority,
        reportedById: user.id,
        assignedToId: template.defaultAssignedToId,
        departmentId: template.departmentId || equipment.departmentId,
        status: "open",
        dueBy,
      })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/maintenance/work-orders");
    revalidatePath("/my-work-orders");

    return { success: true, data: { id: workOrder.id } };
  } catch (error) {
    console.error("Failed to create work order from template:", error);
    return {
      success: false,
      error: "Failed to create work order. Please try again.",
    };
  }
}

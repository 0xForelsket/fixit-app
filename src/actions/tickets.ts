"use server";

import { db } from "@/db";
import {
  attachments,
  equipment as equipmentTable,
  notifications,
  ticketLogs,
  tickets,
  users,
} from "@/db/schema";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { ticketLogger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/session";
import { calculateDueBy } from "@/lib/sla";
import {
  createTicketSchema,
  resolveTicketSchema,
  updateTicketSchema,
} from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  error?: string;
  success?: boolean;
  data?: unknown;
};

export async function createTicket(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in to create a ticket" };
  }

  // Extract attachments from JSON if provided
  const attachmentsJson = formData.get("attachments")?.toString();
  const parsedAttachments = attachmentsJson ? JSON.parse(attachmentsJson) : [];

  const rawData = {
    equipmentId: Number(formData.get("equipmentId")),
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority") || "medium",
    attachments: parsedAttachments,
  };

  const result = createTicketSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];
    return { error: firstError || "Invalid input" };
  }

  const {
    equipmentId,
    type,
    title,
    description,
    priority,
    attachments: ticketAttachments,
  } = result.data;

  // Calculate SLA due date
  const dueBy = calculateDueBy(priority);

  // Create the ticket within a transaction to ensure all or nothing
  try {
    const ticket = await db.transaction(async (tx) => {
      const [newTicket] = await tx
        .insert(tickets)
        .values({
          equipmentId,
          type,
          title,
          description,
          priority,
          reportedById: user.id,
          status: "open",
          dueBy,
        })
        .returning();

      // Insert attachments if any
      if (ticketAttachments && ticketAttachments.length > 0) {
        await tx.insert(attachments).values(
          ticketAttachments.map((att) => ({
            entityType: "ticket" as const,
            entityId: newTicket.id,
            type: "photo" as const, // Default to photo for ticket uploads
            filename: att.filename,
            s3Key: att.s3Key,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
            uploadedById: user.id,
          }))
        );
      }

      return newTicket;
    });

    // Get equipment details for notifications
    const equipmentItem = await db.query.equipment.findFirst({
      where: eq(equipmentTable.id, equipmentId),
    });

    // Notify techs for critical/high priority tickets
    if (priority === "critical" || priority === "high") {
      const techs = await db.query.users.findMany({
        where: and(eq(users.role, "tech"), eq(users.isActive, true)),
      });

      if (techs.length > 0) {
        await db.insert(notifications).values(
          techs.map((tech) => ({
            userId: tech.id,
            type: "ticket_created" as const,
            title: `New ${priority} Priority Ticket`,
            message: `${title} - ${equipmentItem?.name || "Unknown Equipment"}`,
            link: `/dashboard/tickets/${ticket.id}`,
          }))
        );
      }
    }

    // Notify equipment owner if exists
    if (equipmentItem?.ownerId) {
      await db.insert(notifications).values({
        userId: equipmentItem.ownerId,
        type: "ticket_created" as const,
        title: "Ticket Opened on Your Equipment",
        message: `${title} - ${equipmentItem.name}`,
        link: `/dashboard/tickets/${ticket.id}`,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tickets");
    revalidatePath("/my-tickets");
    revalidatePath("/");

    return { success: true, data: ticket };
  } catch (error) {
    ticketLogger.error({ error, userId: user.id }, "Failed to create ticket");
    return { error: "Failed to create ticket. Please try again." };
  }
}

export async function updateTicket(
  ticketId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_UPDATE)) {
    return { error: "You don't have permission to update tickets" };
  }

  const rawData: Record<string, unknown> = {};
  const status = formData.get("status");
  const priority = formData.get("priority");
  const assignedToId = formData.get("assignedToId");
  const resolutionNotes = formData.get("resolutionNotes");

  if (status) rawData.status = status;
  if (priority) rawData.priority = priority;
  if (assignedToId) rawData.assignedToId = Number(assignedToId) || null;
  if (resolutionNotes) rawData.resolutionNotes = resolutionNotes;

  const result = updateTicketSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid input" };
  }

  const existingTicket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });

  if (!existingTicket) {
    return { error: "Ticket not found" };
  }

  const updateData: Record<string, unknown> = {
    ...result.data,
    updatedAt: new Date(),
  };

  // Set resolvedAt if status is being changed to resolved
  if (
    result.data.status === "resolved" &&
    existingTicket.status !== "resolved"
  ) {
    updateData.resolvedAt = new Date();
  }

  await db.update(tickets).set(updateData).where(eq(tickets.id, ticketId));

  // Log status changes
  if (result.data.status && result.data.status !== existingTicket.status) {
    await db.insert(ticketLogs).values({
      ticketId,
      action: "status_change",
      oldValue: existingTicket.status,
      newValue: result.data.status,
      createdById: user.id,
    });
  }

  // Log assignment changes
  if (
    result.data.assignedToId !== undefined &&
    result.data.assignedToId !== existingTicket.assignedToId
  ) {
    await db.insert(ticketLogs).values({
      ticketId,
      action: "assignment",
      oldValue: existingTicket.assignedToId?.toString() || null,
      newValue: result.data.assignedToId?.toString() || "unassigned",
      createdById: user.id,
    });

    // Notify newly assigned user
    if (result.data.assignedToId) {
      await db.insert(notifications).values({
        userId: result.data.assignedToId,
        type: "ticket_assigned",
        title: "Ticket Assigned to You",
        message: existingTicket.title,
        link: `/dashboard/tickets/${ticketId}`,
      });
    }
  }

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function resolveTicket(
  ticketId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.TICKET_RESOLVE)) {
    return { error: "You don't have permission to resolve tickets" };
  }

  const rawData = {
    resolutionNotes: formData.get("resolutionNotes"),
  };

  const result = resolveTicketSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Resolution notes are required" };
  }

  const existingTicket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });

  if (!existingTicket) {
    return { error: "Ticket not found" };
  }

  await db
    .update(tickets)
    .set({
      status: "resolved",
      resolutionNotes: result.data.resolutionNotes,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  await db.insert(ticketLogs).values({
    ticketId,
    action: "status_change",
    oldValue: existingTicket.status,
    newValue: "resolved",
    createdById: user.id,
  });

  revalidatePath(`/dashboard/tickets/${ticketId}`);
  revalidatePath("/dashboard/tickets");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function addTicketComment(
  ticketId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be logged in" };
  }

  const comment = formData.get("comment")?.toString();
  if (!comment || comment.trim().length === 0) {
    return { error: "Comment is required" };
  }

  await db.insert(ticketLogs).values({
    ticketId,
    action: "comment",
    oldValue: null,
    newValue: comment.trim(),
    createdById: user.id,
  });

  revalidatePath(`/dashboard/tickets/${ticketId}`);

  return { success: true };
}

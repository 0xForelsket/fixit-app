import type { WorkOrderPriority } from "@/db/schema";

// SLA configuration (in hours)
export const DEFAULT_SLA_HOURS: Record<WorkOrderPriority, number> = {
  critical: 2,
  high: 8,
  medium: 24,
  low: 72,
};

// Get SLA hours for a priority
export function getSlaHours(priority: WorkOrderPriority): number {
  return DEFAULT_SLA_HOURS[priority];
}

// Calculate due date based on priority and creation time
export function calculateDueBy(
  priority: WorkOrderPriority,
  createdAt: Date = new Date()
): Date {
  const hours = getSlaHours(priority);
  const dueBy = new Date(createdAt);
  dueBy.setHours(dueBy.getHours() + hours);
  return dueBy;
}

// Check if work order is overdue
export function isOverdue(dueBy: Date | null): boolean {
  if (!dueBy) return false;
  return new Date() > dueBy;
}

// Get time remaining until due (returns negative if overdue)
export function getTimeRemaining(dueBy: Date | null): number {
  if (!dueBy) return 0;
  return dueBy.getTime() - Date.now();
}

// Format time remaining for display
export function formatTimeRemaining(dueBy: Date | null): string {
  const remaining = getTimeRemaining(dueBy);

  if (remaining === 0) return "No deadline";

  const absRemaining = Math.abs(remaining);
  const hours = Math.floor(absRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((absRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let timeStr: string;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    timeStr = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    timeStr = `${hours}h ${minutes}m`;
  } else {
    timeStr = `${minutes}m`;
  }

  return remaining < 0 ? `${timeStr} overdue` : `${timeStr} remaining`;
}

// Get urgency level based on time remaining
export function getUrgencyLevel(
  dueBy: Date | null
): "normal" | "warning" | "critical" | "overdue" {
  const remaining = getTimeRemaining(dueBy);

  if (remaining === 0) return "normal";
  if (remaining < 0) return "overdue";

  const hoursRemaining = remaining / (1000 * 60 * 60);

  if (hoursRemaining <= 1) return "critical";
  if (hoursRemaining <= 4) return "warning";
  return "normal";
}

// Calculate escalation time (when work order should be escalated if not resolved)
export function calculateEscalationTime(
  priority: WorkOrderPriority,
  createdAt: Date = new Date()
): Date {
  const dueBy = calculateDueBy(priority, createdAt);
  // Escalate when 25% of SLA time remains
  const slaMs = getSlaHours(priority) * 60 * 60 * 1000;
  const escalationTime = new Date(dueBy.getTime() - slaMs * 0.25);
  return escalationTime;
}

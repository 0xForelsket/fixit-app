/**
 * Format display IDs for various entities
 * Uses minimum 3-digit padding for consistency, grows naturally beyond
 */

/**
 * Format a Work Order display ID
 * @param displayId - The numeric display ID (1, 12, 123, 1234, etc.)
 * @returns Formatted string like "WO-001", "WO-012", "WO-123", "WO-1234"
 */
export function formatWorkOrderId(displayId: number): string {
  // Pad to at least 3 digits, but allow growth
  const padded = displayId.toString().padStart(3, '0');
  return `WO-${padded}`;
}

/**
 * Parse a Work Order display ID from a formatted string
 * @param formattedId - The formatted ID like "WO-001" or "WO-1234"
 * @returns The numeric display ID, or null if invalid format
 */
export function parseWorkOrderId(formattedId: string): number | null {
  // Handle both "WO-123" and "123" formats
  const match = formattedId.match(/^(?:WO-)?(\d+)$/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * Generate the URL path for a work order
 * @param displayId - The numeric display ID
 * @returns URL path like "/maintenance/work-orders/WO-001"
 */
export function getWorkOrderPath(displayId: number): string {
  return `/maintenance/work-orders/${formatWorkOrderId(displayId)}`;
}

// Future: Add similar functions for other entities as needed
// export function formatEquipmentId(displayId: number): string { ... }
// export function formatScheduleId(displayId: number): string { ... }

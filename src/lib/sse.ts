/**
 * Server-Sent Events (SSE) Connection Manager
 *
 * Manages active SSE connections for real-time notifications.
 * Each user can have multiple connections (multiple tabs/devices).
 */

export interface SSEClient {
  userId: number;
  controller: ReadableStreamDefaultController;
  createdAt: Date;
}

export interface SSEMessage {
  event: string;
  data: unknown;
}

// In-memory store of active connections
// Map of userId -> Set of controllers
const clients = new Map<number, Set<ReadableStreamDefaultController>>();

/**
 * Register a new SSE client connection
 */
export function addClient(
  userId: number,
  controller: ReadableStreamDefaultController
): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(controller);
}

/**
 * Remove a client connection (on disconnect)
 */
export function removeClient(
  userId: number,
  controller: ReadableStreamDefaultController
): void {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.delete(controller);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

/**
 * Send a message to a specific user's connections
 */
export function sendToUser(userId: number, message: SSEMessage): void {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;

  const payload = formatSSEMessage(message);
  const encoder = new TextEncoder();

  for (const controller of userClients) {
    try {
      controller.enqueue(encoder.encode(payload));
    } catch {
      // Client disconnected, clean up
      removeClient(userId, controller);
    }
  }
}

/**
 * Send a message to multiple users
 */
export function sendToUsers(userIds: number[], message: SSEMessage): void {
  for (const userId of userIds) {
    sendToUser(userId, message);
  }
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcast(message: SSEMessage): void {
  const payload = formatSSEMessage(message);
  const encoder = new TextEncoder();

  for (const [userId, controllers] of clients) {
    for (const controller of controllers) {
      try {
        controller.enqueue(encoder.encode(payload));
      } catch {
        removeClient(userId, controller);
      }
    }
  }
}

/**
 * Format a message according to SSE spec
 * https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
 */
function formatSSEMessage(message: SSEMessage): string {
  const lines: string[] = [];

  if (message.event) {
    lines.push(`event: ${message.event}`);
  }

  const dataStr =
    typeof message.data === "string"
      ? message.data
      : JSON.stringify(message.data);

  // Split data by newlines (SSE spec requires each line prefixed with "data:")
  for (const line of dataStr.split("\n")) {
    lines.push(`data: ${line}`);
  }

  // Double newline signals end of message
  return lines.join("\n") + "\n\n";
}

/**
 * Get count of connected clients for monitoring
 */
export function getConnectionStats(): {
  totalConnections: number;
  uniqueUsers: number;
} {
  let totalConnections = 0;
  for (const controllers of clients.values()) {
    totalConnections += controllers.size;
  }
  return {
    totalConnections,
    uniqueUsers: clients.size,
  };
}

/**
 * Check if a user has any active connections
 */
export function isUserConnected(userId: number): boolean {
  const userClients = clients.get(userId);
  return !!userClients && userClients.size > 0;
}

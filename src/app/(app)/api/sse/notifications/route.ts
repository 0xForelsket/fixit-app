import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { addClient, removeClient } from "@/lib/sse";
import { desc, eq } from "drizzle-orm";

/**
 * SSE endpoint for real-time notifications
 *
 * Clients connect via EventSource and receive:
 * - Initial notification list on connect
 * - Real-time updates when new notifications arrive
 * - Heartbeat pings to keep connection alive
 */
export async function GET(): Promise<Response> {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = user.id;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Register this client
      addClient(userId, controller);

      // Send initial notifications on connect
      try {
        const initialNotifications = await db.query.notifications.findMany({
          where: eq(notifications.userId, userId),
          orderBy: [desc(notifications.createdAt)],
          limit: 20,
        });

        const initMessage = formatSSE("init", {
          notifications: initialNotifications,
        });
        controller.enqueue(encoder.encode(initMessage));
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }

      // Heartbeat to keep connection alive (every 30 seconds)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Store cleanup function for when stream is cancelled
      (controller as unknown as { cleanup: () => void }).cleanup = () => {
        clearInterval(heartbeatInterval);
        removeClient(userId, controller);
      };
    },

    cancel(controller) {
      // Clean up when client disconnects
      const cleanup = (controller as unknown as { cleanup?: () => void })
        .cleanup;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

/**
 * Format data as SSE message
 */
function formatSSE(event: string, data: unknown): string {
  const lines: string[] = [`event: ${event}`];
  const dataStr = JSON.stringify(data);

  for (const line of dataStr.split("\n")) {
    lines.push(`data: ${line}`);
  }

  return `${lines.join("\n")}\n\n`;
}

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Use synchronous logging to avoid thread-stream issues with Next.js Turbopack
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  // In dev, use browser-style output; in prod, use JSON
  ...(isDev && {
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  }),
});

// Create child loggers for different modules
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "db" });
export const apiLogger = logger.child({ module: "api" });
export const inventoryLogger = logger.child({ module: "inventory" });
export const ticketLogger = logger.child({ module: "ticket" });


import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

// Create child loggers for different modules
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "db" });
export const apiLogger = logger.child({ module: "api" });
export const inventoryLogger = logger.child({ module: "inventory" });
export const ticketLogger = logger.child({ module: "ticket" });

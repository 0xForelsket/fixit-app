import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  }),
});

export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "db" });
export const apiLogger = logger.child({ module: "api" });
export const inventoryLogger = logger.child({ module: "inventory" });
export const workOrderLogger = logger.child({ module: "workOrder" });
export const schedulerLogger = logger.child({ module: "scheduler" });

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

type ApiHandler = (
  request: Request,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

export function withRequestLogging(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { method, url } = request;
    const pathname = new URL(url).pathname;

    apiLogger.info({ requestId, method, pathname }, "Request started");

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      apiLogger.info(
        { requestId, method, pathname, status: response.status, duration },
        "Request completed"
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      apiLogger.error(
        { requestId, method, pathname, duration, error: String(error) },
        "Request failed"
      );
      throw error;
    }
  };
}

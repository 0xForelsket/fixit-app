import { db } from "@/db";
import { type EntityType, auditLogs } from "@/db/schema";
import { cn, formatRelativeTime } from "@/lib/utils";
import { and, desc, eq } from "drizzle-orm";
import { Activity, Clock, User } from "lucide-react";

interface AuditLogListProps {
  entityType: EntityType;
  entityId: string;
}

export async function AuditLogList({
  entityType,
  entityId,
}: AuditLogListProps) {
  const logs = await db.query.auditLogs.findMany({
    where: and(
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId)
    ),
    orderBy: [desc(auditLogs.createdAt)],
    with: {
      user: true,
    },
    limit: 50,
  });

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 rounded-xl border border-dashed">
        <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          No system logs found for this item.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        let parsedDetails = null;
        if (log.details) {
          try {
            parsedDetails =
              typeof log.details === "string"
                ? JSON.parse(log.details)
                : log.details;
          } catch (_e) {
            parsedDetails = { error: "Failed to parse details" };
          }
        }

        const detailsString = parsedDetails
          ? JSON.stringify(parsedDetails, null, 2)
          : "";

        return (
          <div
            key={log.id}
            className={cn("relative pl-8 pb-4 last:pb-0 group")}
          >
            {/* Vertical line connector */}
            {index !== logs.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100 group-hover:bg-slate-200 transition-colors" />
            )}

            {/* Dot */}
            <div
              className={cn(
                "absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center z-10",
                log.action === "CREATE"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : log.action === "DELETE"
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-blue-50 border-blue-200 text-blue-600"
              )}
            >
              <div className="h-2 w-2 rounded-full bg-current" />
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm uppercase tracking-wider">
                  {log.action}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(log.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm mb-3">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {log.user?.name || "System"}
                </span>
                <span className="text-muted-foreground text-xs">
                  • {log.user?.employeeId || "auto"}
                </span>
              </div>

              {parsedDetails && (
                <div className="bg-slate-50 rounded p-2 text-xs font-mono text-slate-600 overflow-x-auto">
                  <pre>{detailsString}</pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

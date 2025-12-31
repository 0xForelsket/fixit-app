import { formatRelativeTime } from "@/lib/utils";
import { Clock, MessageSquare, User } from "lucide-react";
import type { ReactNode } from "react";

export interface ActivityLogItem {
  id: number | string;
  actor: {
    name: string;
    avatar?: string;
  };
  action: string;
  createdAt: Date;
  content?: ReactNode; // For comments or complex content
  oldValue?: string | null;
  newValue?: string | null;
  formatValue?: (action: string, value: string | null) => string;
}

interface ActivityLogProps {
  logs: ActivityLogItem[];
  emptyMessage?: string;
  type?: "history" | "comments"; // 'history' uses minimal styling, 'comments' emphasizes content
}

export function ActivityLog({
  logs,
  emptyMessage = "No activity recorded",
}: ActivityLogProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border-2 border-border mb-4">
          <Clock className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-black text-foreground">No Activity</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="group relative pl-8 pb-2 last:pb-0">
          {/* Timeline Line */}
          <div className="absolute left-3.5 top-8 bottom-0 w-px bg-border group-last:hidden" />

          {/* Icon/Avatar */}
          <div className="absolute left-0 top-1">
            {log.action === "comment" ? (
              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shadow-sm border border-border">
                {log.actor.avatar ? (
                  <span className="text-[10px] font-bold">
                    {log.actor.avatar}
                  </span>
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-sm transition-all hover:border-border/80">
            {/* Header: Actor & Time */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-bold text-foreground">
                {log.actor.name}
              </span>
              <span
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider tabular-nums"
                suppressHydrationWarning
              >
                {formatRelativeTime(log.createdAt)}
              </span>
            </div>

            {/* Content */}
            {log.action === "comment" ? (
              <div className="text-sm text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 leading-relaxed whitespace-pre-wrap">
                {log.newValue}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Changed{" "}
                <strong className="text-foreground font-bold uppercase text-xs tracking-wide">
                  {log.action.replace("_", " ")}
                </strong>{" "}
                from{" "}
                <span className="line-through decoration-muted-foreground/50 text-muted-foreground/80 decoration-2">
                  {log.formatValue
                    ? log.formatValue(log.action, log.oldValue || null)
                    : log.oldValue || "none"}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground bg-accent/30 px-1 py-0.5 rounded textxs">
                  {log.formatValue
                    ? log.formatValue(log.action, log.newValue || null)
                    : log.newValue}
                </span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

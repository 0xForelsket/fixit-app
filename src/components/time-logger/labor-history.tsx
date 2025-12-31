import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LaborLog, User } from "@/db/schema";
import { Trash2 } from "lucide-react";

interface LaborHistoryProps {
  logs: (LaborLog & { user?: User })[];
  onDelete: (id: number) => void;
}

export function LaborHistory({ logs, onDelete }: LaborHistoryProps) {
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">
          History
        </CardTitle>
        <span className="text-[10px] font-bold text-zinc-400">
          {logs.length} Entries
        </span>
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="group relative flex items-center justify-between rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-sm text-foreground">
                  {log.durationMinutes}m
                </p>
                {log.hourlyRate && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    $
                    {(
                      ((log.durationMinutes || 0) / 60) *
                      log.hourlyRate
                    ).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                <span className="truncate max-w-[100px]">
                  {log.user?.name || "Unknown"}
                </span>
                <span>•</span>
                <span suppressHydrationWarning>
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString()
                    : ""}
                </span>
              </div>
              {log.notes && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1 italic font-medium">
                  "{log.notes}"
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              onClick={() => onDelete(log.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

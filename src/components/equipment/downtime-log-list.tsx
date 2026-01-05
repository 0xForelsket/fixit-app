import { EndDowntimeButton } from "@/components/equipment";
import { Badge } from "@/components/ui/badge";
// Since we can't easily infer the 'with' type here without a Drizzle helper,
// we'll define a simpler interface for the props we need.
interface DowntimeLog {
  id: string;
  reasonCode: string;
  startTime: Date;
  endTime: Date | null;
  notes: string | null;
}

interface DowntimeLogListProps {
  logs: DowntimeLog[];
  canReportDowntime: boolean;
}

export function DowntimeLogList({
  logs,
  canReportDowntime,
}: DowntimeLogListProps) {
  const downtimeReasonLabels: Record<string, string> = {
    mechanical_failure: "Mechanical Failure",
    electrical_failure: "Electrical Failure",
    no_operator: "No Operator",
    no_materials: "No Materials",
    planned_maintenance: "Planned Maintenance",
    changeover: "Changeover",
    other: "Other",
  };

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No downtime recorded
      </div>
    );
  }

  return (
    <div className="divide-y">
      {logs.map((log) => {
        const duration = log.endTime
          ? Math.round(
              (log.endTime.getTime() - log.startTime.getTime()) / 60000
            )
          : null;
        return (
          <div key={log.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">
                  {downtimeReasonLabels[log.reasonCode] || log.reasonCode}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.startTime.toLocaleDateString()}{" "}
                  {log.startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                {duration !== null ? (
                  <Badge variant="outline">
                    {duration >= 60
                      ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                      : `${duration}m`}
                  </Badge>
                ) : (
                  <>
                    <Badge variant="danger">Ongoing</Badge>
                    {canReportDowntime && (
                      <EndDowntimeButton downtimeId={log.id} />
                    )}
                  </>
                )}
              </div>
            </div>
            {log.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                {log.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

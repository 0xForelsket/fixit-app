import { Card, CardContent } from "@/components/ui/card";
import type { LaborLog } from "@/db/schema";

interface LaborSummaryProps {
  logs: LaborLog[];
}

export function LaborSummary({ logs }: LaborSummaryProps) {
  if (logs.length === 0) return null;

  const totalMinutes = logs.reduce(
    (sum, log) => sum + (log.durationMinutes || 0),
    0
  );

  const totalCost = logs.reduce((sum, log) => {
    if (!log.durationMinutes || !log.hourlyRate) return sum;
    return sum + (log.durationMinutes / 60) * log.hourlyRate;
  }, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
            Total Labor
          </p>
          <p className="text-2xl font-black text-primary-600">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
            Estimated Cost
          </p>
          <p className="text-2xl font-black text-emerald-600">
            ${totalCost.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

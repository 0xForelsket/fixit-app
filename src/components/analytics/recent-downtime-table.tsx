"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RecentDowntimeEvent {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentCode: string;
  startTime: Date;
  endTime: Date | null;
  downtimeHours: number;
  workOrderId: number | null;
  workOrderTitle: string | null;
  workOrderType: string | null;
}

interface RecentDowntimeTableProps {
  data: RecentDowntimeEvent[];
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  }
  if (hours >= 1) {
    return `${hours.toFixed(1)} hrs`;
  }
  return `${(hours * 60).toFixed(0)} min`;
}

const typeStyles: Record<string, string> = {
  breakdown: "bg-red-100 text-red-800 border-red-200",
  maintenance: "bg-blue-100 text-blue-800 border-blue-200",
  calibration: "bg-purple-100 text-purple-800 border-purple-200",
  safety: "bg-yellow-100 text-yellow-800 border-yellow-200",
  upgrade: "bg-green-100 text-green-800 border-green-200",
};

export function RecentDowntimeTable({ data }: RecentDowntimeTableProps) {
  return (
    <Card className="card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            RECENT DOWNTIME EVENTS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No recent downtime events
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Equipment
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Start Time
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    End Time
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 text-right">
                    Duration
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Work Order
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Type
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, index) => (
                  <TableRow
                    key={event.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50",
                      !event.endTime && "bg-danger-50/30"
                    )}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/assets/equipment/${event.equipmentId}`}
                          className="text-sm font-medium truncate max-w-[180px] hover:text-primary hover:underline"
                        >
                          {event.equipmentName}
                        </Link>
                        <span className="text-xs text-muted-foreground font-mono">
                          {event.equipmentCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDateTime(event.startTime)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.endTime ? (
                        formatDateTime(event.endTime)
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800 border-red-200 text-[10px] font-bold uppercase"
                        >
                          Ongoing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatDuration(event.downtimeHours)}
                    </TableCell>
                    <TableCell>
                      {event.workOrderId ? (
                        <Link
                          href={`/maintenance/work-orders/${event.workOrderId}`}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          #{event.workOrderId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.workOrderType ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            typeStyles[event.workOrderType] ||
                              "bg-zinc-100 text-zinc-800 border-zinc-200"
                          )}
                        >
                          {event.workOrderType}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-zinc-100 text-zinc-800 border-zinc-200 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Unknown
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

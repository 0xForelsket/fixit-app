"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import Link from "next/link";

interface RecentDowntimeEvent {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  startTime: Date;
  endTime: Date | null;
  downtimeHours: number;
  workOrderId: string | null;
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

// StatusBadge will handle the types

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
          <EmptyState
            title="No recent downtime events"
            description="All equipment appears to be operational for the selected period."
            icon={Clock}
            className="border-none bg-transparent py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Equipment
                  </TableHead>
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Start Time
                  </TableHead>
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    End Time
                  </TableHead>
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap text-right">
                    Duration
                  </TableHead>
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Work Order
                  </TableHead>
                  <TableHead className="h-12 px-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                    Type
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((event, _index) => (
                  <TableRow
                    key={event.id}
                    className={cn(
                      "transition-colors hover:bg-muted/50 border-b border-border group",
                      !event.endTime && "bg-danger-500/5"
                    )}
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col">
                        <Link
                          href={`/assets/equipment/${event.equipmentCode}`}
                          className="text-sm font-bold truncate max-w-[180px] text-foreground hover:text-primary transition-colors"
                        >
                          {event.equipmentName}
                        </Link>
                        <span className="text-[10px] text-muted-foreground font-black tracking-wider uppercase opacity-60">
                          {event.equipmentCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 font-mono text-xs font-bold text-muted-foreground">
                      {formatDateTime(event.startTime)}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-mono text-xs font-bold text-muted-foreground">
                      {event.endTime ? (
                        formatDateTime(event.endTime)
                      ) : (
                        <StatusBadge status="down" pulse />
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <span className="font-mono text-sm font-black tracking-tighter text-foreground">
                        {formatDuration(event.downtimeHours)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {event.workOrderId ? (
                        <Link
                          href={`/maintenance/work-orders/${event.workOrderId}`}
                          className="inline-flex items-center font-mono text-xs font-black text-primary hover:underline"
                        >
                          #{event.workOrderId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <StatusBadge status={event.workOrderType || "unknown"} />
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

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronRight, Settings, Wrench } from "lucide-react";
import Link from "next/link";

interface Schedule {
  id: number;
  title: string;
  type: string;
  frequencyDays: number;
  nextDue: string | Date | null;
  isActive: boolean;
  equipment?: {
    name: string;
    location?: {
      name: string;
    } | null;
  } | null;
}

interface SchedulesTableProps {
  schedules: Schedule[];
}

export function SchedulesTable({ schedules }: SchedulesTableProps) {
  const today = new Date();

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Wrench className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No schedules found</h3>
        <p className="text-sm text-muted-foreground">
          No active maintenance schedules to display
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table className="w-full text-sm">
        <TableHeader className="bg-muted/50">
          <TableRow className="border-b text-left font-medium text-muted-foreground hover:bg-transparent">
            <TableHead className="p-3 text-[10px] font-black uppercase tracking-widest">
              Schedule
            </TableHead>
            <TableHead className="p-3 text-[10px] font-black uppercase tracking-widest hidden md:table-cell">
              Equipment
            </TableHead>
            <TableHead className="p-3 text-[10px] font-black uppercase tracking-widest hidden lg:table-cell">
              Frequency
            </TableHead>
            <TableHead className="p-3 text-[10px] font-black uppercase tracking-widest">
              Next Due
            </TableHead>
            <TableHead className="p-3 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">
              Status
            </TableHead>
            <TableHead className="p-3 w-10" />
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y">
          {schedules.map((schedule) => {
            const dueDate = schedule.nextDue
              ? new Date(schedule.nextDue)
              : null;
            const isOverdue = dueDate && dueDate < today;
            const daysUntil = dueDate
              ? Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <TableRow
                key={schedule.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors group",
                  isOverdue && "bg-rose-50/50"
                )}
              >
                <TableCell className="p-3">
                  <Link
                    href={`/maintenance/schedules/${schedule.id}`}
                    className="flex items-center gap-3 group/item"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover/item:scale-110",
                        schedule.type === "maintenance"
                          ? "bg-primary-50"
                          : "bg-amber-50"
                      )}
                    >
                      {schedule.type === "maintenance" ? (
                        <Wrench className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Settings className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium group-hover/item:text-primary-600 transition-colors">
                        {schedule.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {schedule.type}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="p-3 hidden md:table-cell">
                  <p className="font-medium">{schedule.equipment?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.equipment?.location?.name}
                  </p>
                </TableCell>
                <TableCell className="p-3 hidden lg:table-cell text-muted-foreground">
                  Every {schedule.frequencyDays} days
                </TableCell>
                <TableCell className="p-3">
                  {dueDate ? (
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          isOverdue && "text-rose-600"
                        )}
                      >
                        {dueDate.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isOverdue
                          ? `${Math.abs(daysUntil!)} days overdue`
                          : daysUntil === 0
                            ? "Today"
                            : `In ${daysUntil} days`}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </TableCell>
                <TableCell className="p-3 hidden sm:table-cell">
                  <Badge variant={schedule.isActive ? "success" : "secondary"}>
                    {schedule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="p-3">
                  <Link
                    href={`/maintenance/schedules/${schedule.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

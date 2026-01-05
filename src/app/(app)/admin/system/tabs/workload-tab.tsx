"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export interface TechnicianWorkload {
  id: string;
  name: string;
  departmentName: string | null;
  openCount: number;
  inProgressCount: number;
  criticalCount: number;
  overdueCount: number;
}

interface WorkloadTabProps {
  technicians: TechnicianWorkload[];
}

function getWorkloadLevel(
  total: number
): "low" | "medium" | "high" | "overloaded" {
  if (total === 0) return "low";
  if (total <= 3) return "low";
  if (total <= 6) return "medium";
  if (total <= 10) return "high";
  return "overloaded";
}

function getWorkloadStyles(level: "low" | "medium" | "high" | "overloaded") {
  switch (level) {
    case "low":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        bar: "bg-green-500",
        label: "Low",
      };
    case "medium":
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        bar: "bg-primary",
        label: "Medium",
      };
    case "high":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        bar: "bg-amber-500",
        label: "High",
      };
    case "overloaded":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        bar: "bg-red-500",
        label: "Overloaded",
      };
  }
}

export function WorkloadTab({ technicians }: WorkloadTabProps) {
  // Calculate overall stats
  const totalTechs = technicians.length;
  const totalOpenWOs = technicians.reduce((sum, t) => sum + t.openCount, 0);
  const totalInProgress = technicians.reduce(
    (sum, t) => sum + t.inProgressCount,
    0
  );
  const totalCritical = technicians.reduce(
    (sum, t) => sum + t.criticalCount,
    0
  );
  const totalOverdue = technicians.reduce((sum, t) => sum + t.overdueCount, 0);

  // Sort by total workload (descending)
  const sortedTechnicians = [...technicians].sort((a, b) => {
    const aTotal = a.openCount + a.inProgressCount;
    const bTotal = b.openCount + b.inProgressCount;
    return bTotal - aTotal;
  });

  // Find max workload for scaling
  const maxWorkload = Math.max(
    ...technicians.map((t) => t.openCount + t.inProgressCount),
    1
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Technicians
            </span>
          </div>
          <div className="text-2xl font-black">{totalTechs}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Open WOs
            </span>
          </div>
          <div className="text-2xl font-black text-primary">{totalOpenWOs}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              In Progress
            </span>
          </div>
          <div className="text-2xl font-black text-amber-500">
            {totalInProgress}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Critical/Overdue
            </span>
          </div>
          <div className="text-2xl font-black text-red-500">
            {totalCritical + totalOverdue}
          </div>
        </div>
      </div>

      {/* Technician List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-black uppercase tracking-wider">
            Technician Workload Distribution
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            View assigned work orders per technician
          </p>
        </div>

        {sortedTechnicians.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No technicians found</p>
            <p className="text-sm">
              Add users with the technician role to see workload data
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedTechnicians.map((tech) => {
              const total = tech.openCount + tech.inProgressCount;
              const level = getWorkloadLevel(total);
              const styles = getWorkloadStyles(level);
              const barWidth =
                maxWorkload > 0 ? (total / maxWorkload) * 100 : 0;

              return (
                <div
                  key={tech.id}
                  className="px-4 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                        {tech.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{tech.name}</div>
                        {tech.departmentName && (
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {tech.departmentName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Workload Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              styles.bar
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase shrink-0",
                            styles.bg,
                            styles.text
                          )}
                        >
                          {styles.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-black text-primary">
                          {tech.openCount}
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Open
                        </div>
                      </div>
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-black text-amber-500">
                          {tech.inProgressCount}
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          Active
                        </div>
                      </div>
                      {(tech.criticalCount > 0 || tech.overdueCount > 0) && (
                        <div className="text-center min-w-[50px]">
                          <div className="text-lg font-black text-red-500">
                            {tech.criticalCount + tech.overdueCount}
                          </div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                            Urgent
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] font-black uppercase tracking-widest shrink-0"
                      asChild
                    >
                      <Link
                        href={`/maintenance/work-orders?assigned=${tech.id}`}
                      >
                        View WOs
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Low (0-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Medium (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">High (7-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Overloaded (10+)</span>
        </div>
      </div>
    </div>
  );
}

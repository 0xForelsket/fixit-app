"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface KPIs {
  openTickets: number;
  highPriorityOpen: number;
  mttrHours: number;
  slaRate: number;
  period: string;
}

interface TrendPoint {
  day: string;
  created_count: number;
  resolved_count: number;
}

interface TechStat {
  id: number;
  name: string;
  resolvedCount: number;
  activeCount: number;
}

interface MachineStat {
  id: number;
  name: string;
  code: string;
  breakdowns: number;
  downtimeHours: number;
  totalTickets: number;
}

export function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [techStats, setTechStats] = useState<TechStat[]>([]);
  const [machineStats, setMachineStats] = useState<MachineStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, trendRes, techRes, machineRes] = await Promise.all([
          fetch("/api/analytics/kpis"),
          fetch("/api/analytics/trends"),
          fetch("/api/analytics/technicians"),
          fetch("/api/analytics/machines"),
        ]);

        if (kpiRes.ok) setKpis(await kpiRes.json());
        if (trendRes.ok) setTrends(await trendRes.json());
        if (techRes.ok) setTechStats(await techRes.json());
        if (machineRes.ok) setMachineStats(await machineRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metric MTTR (30d)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.mttrHours || 0}h</div>
            <p className="text-xs text-muted-foreground">Mean Time To Repair</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SLA Compliance
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.slaRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Resolved within deadline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Total backlog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {kpis?.highPriorityOpen || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Critical or High (Open)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ticket Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px" }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created_count"
                    name="Created"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved_count"
                    name="Resolved"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Technician Stats */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="resolvedCount"
                    name="Resolved"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="activeCount"
                    name="Active"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Machine Health Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Machines by Breakdowns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {machineStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No breakdown data available.
              </p>
            ) : (
              machineStats.map((machine) => (
                <div
                  key={machine.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {machine.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({machine.code})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-600">
                        {machine.breakdowns}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Breakdowns
                      </p>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-sm font-bold">
                        {machine.downtimeHours}h
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Est. Downtime
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

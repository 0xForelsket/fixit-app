"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

interface EquipmentStat {
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
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, trendRes, techRes, equipmentRes] = await Promise.all([
          fetch("/api/analytics/kpis"),
          fetch("/api/analytics/trends"),
          fetch("/api/analytics/technicians"),
          fetch("/api/analytics/equipment"),
        ]);

        if (kpiRes.ok) setKpis(await kpiRes.json());
        if (trendRes.ok) setTrends(await trendRes.json());
        if (techRes.ok) setTechStats(await techRes.json());
        if (equipmentRes.ok) setEquipmentStats(await equipmentRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="h-10 w-10 border-4 border-zinc-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-widest">
          Initialising Analytics Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="MTTR (30d)"
          value={`${kpis?.mttrHours || 0}h`}
          description="Mean Time To Repair"
          icon={Clock}
          color="text-secondary-600"
          bg="bg-secondary-50"
        />
        <StatsCard
          title="SLA Compliance"
          value={`${kpis?.slaRate || 0}%`}
          description="Resolved within deadline"
          icon={CheckCircle2}
          color="text-success-600"
          bg="bg-success-50"
        />
        <StatsCard
          title="Open Tickets"
          value={kpis?.openTickets || 0}
          description="Current system backlog"
          icon={BarChart3}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatsCard
          title="Critical Issues"
          value={kpis?.highPriorityOpen || 0}
          description="Open High/Critical"
          icon={AlertCircle}
          color="text-danger-600"
          bg="bg-danger-50"
          pulse={!!kpis?.highPriorityOpen}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="col-span-4 card-industrial border-zinc-200 shadow-sm animate-in">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
              <CardTitle className="text-lg font-black tracking-tight">
                SYSTEM THROUGHPUT
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <XAxis
                    dataKey="day"
                    stroke="#a1a1aa"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    stroke="#a1a1aa"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="created_count"
                    name="CREATED"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#f97316",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved_count"
                    name="RESOLVED"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#22c55e",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Technician Stats */}
        <Card className="col-span-3 card-industrial border-zinc-200 shadow-sm animate-in animate-stagger-2">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-secondary-500 rounded-full" />
              <CardTitle className="text-lg font-black tracking-tight">
                OPERATIONS CAPACITY
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={techStats}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    stroke="#a1a1aa"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{ borderRadius: "12px" }}
                  />
                  <Legend iconType="circle" />
                  <Bar
                    dataKey="resolvedCount"
                    name="RESOLVED"
                    fill="#22c55e"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="activeCount"
                    name="ACTIVE"
                    fill="#f59e0b"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Health Rankings */}
      <Card className="card-industrial border-zinc-200 shadow-sm animate-in animate-stagger-3">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-4 bg-danger-500 rounded-full" />
            <CardTitle className="text-lg font-black tracking-tight">
              EQUIPMENT STRESS REPORT
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {equipmentStats.length === 0 ? (
              <p className="text-zinc-400 text-center py-8 font-medium italic">
                No breakdown data detected in active window.
              </p>
            ) : (
              equipmentStats.map((equipment, index) => (
                <div
                  key={equipment.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 transition-all hover-lift"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs font-black">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                        {equipment.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                        ID: {equipment.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                      <p className="text-lg font-mono font-black text-danger-600 leading-none">
                        {equipment.breakdowns}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        FAILURES
                      </p>
                    </div>
                    <div className="flex flex-col items-end w-24">
                      <p className="text-lg font-mono font-black text-zinc-900 leading-none">
                        {equipment.downtimeHours}h
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        DOWNTIME
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

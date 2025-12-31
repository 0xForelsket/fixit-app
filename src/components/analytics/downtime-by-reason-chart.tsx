"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DowntimeByReason {
  reason: string;
  downtimeHours: number;
  incidentCount: number;
  percentage: number;
}

interface DowntimeByReasonChartProps {
  data: DowntimeByReason[];
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
];

export function DowntimeByReasonChart({ data }: DowntimeByReasonChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const totalHours = data.reduce((sum, d) => sum + d.downtimeHours, 0);

  return (
    <Card className="col-span-3 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-warning-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            DOWNTIME BY REASON
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No downtime data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="downtimeHours"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload as DowntimeByReason & {
                        color: string;
                      };
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold">{item.reason}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="font-mono font-bold text-lg">
                              {item.downtimeHours.toFixed(1)} hrs
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.percentage.toFixed(1)}% of total
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.incidentCount} incidents
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  iconType="circle"
                  verticalAlign="bottom"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                  formatter={(value, entry: any) => {
                    const item = chartData.find((d) => d.reason === value);
                    const percentage = item ? item.percentage.toFixed(0) : 0;
                    return (
                      <span className="text-zinc-600">
                        {value} ({percentage}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

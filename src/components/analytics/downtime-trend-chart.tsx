"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DowntimeTrendPoint {
  month: string;
  downtimeHours: number;
  incidentCount: number;
}

interface DowntimeTrendChartProps {
  data: DowntimeTrendPoint[];
}

function formatHours(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function DowntimeTrendChart({ data }: DowntimeTrendChartProps) {
  return (
    <Card className="col-span-4 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-danger-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            DOWNTIME TREND
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <EmptyState
              title="No trend data available"
              description="Not enough downtime events found for the selected period to generate a trend."
              icon={TrendingDown}
              className="border-none bg-transparent py-12"
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorDowntime"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e4e4e7"
                />
                <XAxis
                  dataKey="month"
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="var(--font-sans)"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={formatMonth}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="var(--font-sans)"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `${formatHours(value)}h`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && label) {
                      const point = payload[0]?.payload as DowntimeTrendPoint;
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <p className="mb-2 font-mono text-xs text-zinc-500">
                            {formatMonth(String(label))}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="font-medium text-zinc-700">
                                Downtime:
                              </span>
                              <span className="font-mono font-bold">
                                {point.downtimeHours.toFixed(1)} hrs
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <span className="font-medium text-zinc-700">
                                Incidents:
                              </span>
                              <span className="font-mono font-bold">
                                {point.incidentCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="downtimeHours"
                  name="Downtime"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDowntime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

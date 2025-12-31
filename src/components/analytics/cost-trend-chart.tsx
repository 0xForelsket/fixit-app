"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CostTrendPoint {
  month: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

interface CostTrendChartProps {
  data: CostTrendPoint[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function CostTrendChart({ data }: CostTrendChartProps) {
  return (
    <Card className="col-span-4 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            COST TREND
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No cost data available for the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLabor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorParts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && label) {
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <p className="mb-2 font-mono text-xs text-zinc-500">
                            {formatMonth(String(label))}
                          </p>
                          <div className="space-y-1">
                            {payload.map((entry: any) => (
                              <div
                                key={entry.name}
                                className="flex items-center gap-2 text-sm"
                              >
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="font-medium text-zinc-700">
                                  {entry.name}:
                                </span>
                                <span className="font-mono font-bold">
                                  {formatCurrency(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="laborCost"
                  name="LABOR"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLabor)"
                />
                <Area
                  type="monotone"
                  dataKey="partsCost"
                  name="PARTS"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorParts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

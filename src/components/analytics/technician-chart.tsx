"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TechStat {
  id: number;
  name: string;
  resolvedCount: number;
  activeCount: number;
}

interface TechnicianChartProps {
  data: TechStat[];
}

export function TechnicianChart({ data }: TechnicianChartProps) {
  return (
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
            <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e4e4e7"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                stroke="#71717a"
                fontSize={12}
                fontFamily="var(--font-sans)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
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
                                {entry.value}
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
              <Bar
                dataKey="resolvedCount"
                name="RESOLVED"
                fill="#0d9488"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
              <Bar
                dataKey="activeCount"
                name="ACTIVE"
                fill="#ea580c"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
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
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
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
  );
}

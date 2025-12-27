"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  day: string;
  created_count: number;
  resolved_count: number;
}

interface ThroughputChartProps {
  data: TrendPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  return (
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
            <LineChart data={data}>
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
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
  );
}

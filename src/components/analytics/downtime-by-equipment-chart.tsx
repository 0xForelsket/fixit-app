"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DowntimeByEquipment {
  id: number;
  name: string;
  code: string;
  downtimeHours: number;
  incidentCount: number;
}

interface DowntimeByEquipmentChartProps {
  data: DowntimeByEquipment[];
}

export function DowntimeByEquipmentChart({
  data,
}: DowntimeByEquipmentChartProps) {
  // Truncate equipment names for better chart display
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.name.length > 20 ? `${item.name.slice(0, 17)}...` : item.name,
  }));

  return (
    <Card className="card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-accent rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            TOP 5 EQUIPMENT BY DOWNTIME
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No equipment downtime data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e4e4e7"
                />
                <XAxis
                  type="number"
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="var(--font-sans)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(0)}h`}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]
                        ?.payload as DowntimeByEquipment & {
                        displayName: string;
                      };
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <p className="mb-1 font-semibold text-zinc-900">
                            {item.name}
                          </p>
                          <p className="mb-2 font-mono text-xs text-zinc-500">
                            {item.code}
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="text-zinc-700">Downtime:</span>
                              <span className="font-mono font-bold">
                                {item.downtimeHours.toFixed(1)} hrs
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <span className="text-zinc-700">Incidents:</span>
                              <span className="font-mono font-bold">
                                {item.incidentCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="downtimeHours"
                  name="Downtime"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

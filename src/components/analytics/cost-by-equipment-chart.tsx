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

interface CostByEquipment {
  id: string;
  name: string;
  code: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  workOrderCount: number;
}

interface CostByEquipmentChartProps {
  data: CostByEquipment[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function CostByEquipmentChart({ data }: CostByEquipmentChartProps) {
  // Truncate equipment names for better chart display
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.name.length > 15 ? `${item.name.slice(0, 12)}...` : item.name,
  }));

  return (
    <Card className="col-span-4 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-accent rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            COST BY EQUIPMENT (TOP 10)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No equipment cost data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke="#71717a"
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload as CostByEquipment & {
                        displayName: string;
                      };
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <p className="mb-2 font-semibold text-zinc-900">
                            {item.name}
                          </p>
                          <p className="mb-2 font-mono text-xs text-zinc-500">
                            {item.code}
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <span className="text-zinc-700">Labor:</span>
                              <span className="font-mono font-bold">
                                {formatCurrency(item.laborCost)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-violet-500" />
                              <span className="text-zinc-700">Parts:</span>
                              <span className="font-mono font-bold">
                                {formatCurrency(item.partsCost)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 border-t pt-1 mt-1">
                              <span className="text-zinc-700">Total:</span>
                              <span className="font-mono font-bold">
                                {formatCurrency(item.totalCost)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 text-xs">
                                {item.workOrderCount} work orders
                              </span>
                            </div>
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
                  dataKey="laborCost"
                  name="LABOR"
                  stackId="costs"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="partsCost"
                  name="PARTS"
                  stackId="costs"
                  fill="#8b5cf6"
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

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

interface CostByDepartment {
  id: number;
  name: string;
  code: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

interface CostByDepartmentChartProps {
  data: CostByDepartment[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Industrial color palette
const COLORS = [
  "#ea580c", // orange
  "#0d9488", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#6366f1", // indigo
];

export function CostByDepartmentChart({ data }: CostByDepartmentChartProps) {
  const chartData = data.map((dept, index) => ({
    ...dept,
    color: COLORS[index % COLORS.length],
  }));

  const total = data.reduce((sum, dept) => sum + dept.totalCost, 0);

  return (
    <Card className="col-span-3 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-warning-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            COST BY DEPARTMENT
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No department cost data available
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
                  dataKey="totalCost"
                  nameKey="name"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      const percentage =
                        total > 0
                          ? ((item.totalCost / total) * 100).toFixed(1)
                          : 0;
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({item.code})
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="font-mono font-bold text-lg">
                              {formatCurrency(item.totalCost)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {percentage}% of total
                            </p>
                            <div className="text-xs text-muted-foreground border-t pt-1 mt-1">
                              <p>Labor: {formatCurrency(item.laborCost)}</p>
                              <p>Parts: {formatCurrency(item.partsCost)}</p>
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
                  verticalAlign="bottom"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                  formatter={(value, _entry: any) => {
                    const item = chartData.find((d) => d.name === value);
                    const percentage =
                      item && total > 0
                        ? ((item.totalCost / total) * 100).toFixed(0)
                        : 0;
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

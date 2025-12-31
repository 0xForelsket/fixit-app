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

interface CostDistributionChartProps {
  laborCost: number;
  partsCost: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const COLORS = ["#3b82f6", "#8b5cf6"];

export function CostDistributionChart({
  laborCost,
  partsCost,
}: CostDistributionChartProps) {
  const data = [
    { name: "Labor", value: laborCost, color: COLORS[0] },
    { name: "Parts", value: partsCost, color: COLORS[1] },
  ].filter((d) => d.value > 0);

  const total = laborCost + partsCost;

  return (
    <Card className="col-span-3 card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-success-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            LABOR VS PARTS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          {total === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No cost data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload;
                      const percentage = ((item.value / total) * 100).toFixed(
                        1
                      );
                      return (
                        <div className="rounded-lg border bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold">{item.name}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="font-mono font-bold text-lg">
                              {formatCurrency(item.value)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {percentage}% of total
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
                  formatter={(value) => {
                    const item = data.find((d) => d.name === value);
                    const percentage = item
                      ? ((item.value / total) * 100).toFixed(0)
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

"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Colors for pie chart segments
const PIE_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartWidgetProps {
  data: ChartData[];
}

export function PieChartWidget({ data }: PieChartWidgetProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "10px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

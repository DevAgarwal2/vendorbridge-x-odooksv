"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function formatCurrency(val: number) {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export function SpendingBarChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: unknown) => [formatCurrency(Number(value)), "Spend"]}
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Bar
            dataKey="amount"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

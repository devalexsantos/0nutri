"use client";

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

export type MealsStackPoint = {
  date: string;
  done: number;
  partial: number;
  skipped: number;
};

export function MealsCompletionChart({ data }: { data: MealsStackPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Sem refeições registradas ainda.
      </p>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickFormatter={(v) => String(v).slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => String(label)}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            formatter={(value) =>
              value === "done" ? "Feitas" : value === "partial" ? "Parcial" : "Puladas"
            }
          />
          <Bar dataKey="done" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="partial" stackId="a" fill="var(--color-warning)" />
          <Bar
            dataKey="skipped"
            stackId="a"
            fill="color-mix(in oklch, var(--color-muted-foreground) 40%, transparent)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function WaterDailyChart({
  data,
  goalMl,
}: {
  data: { date: string; ml: number }[];
  goalMl: number;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Sem registros de água ainda.
      </p>
    );
  }
  return (
    <div className="h-48 w-full">
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
            tickFormatter={(v) => `${(Number(v) / 1000).toFixed(1)}L`}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) =>
              typeof v === "number" ? [`${(v / 1000).toFixed(2)} L`, "Água"] : [String(v), "Água"]
            }
            labelFormatter={(label) => String(label)}
          />
          <ReferenceLine y={goalMl} stroke="var(--color-water)" strokeDasharray="4 4" />
          <Bar dataKey="ml" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.ml >= goalMl ? "var(--color-water)" : "color-mix(in oklch, var(--color-water) 50%, transparent)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightTrendPoint } from "@/lib/trends";

export function WeightTrendWithAverage({
  data,
  target,
}: {
  data: WeightTrendPoint[];
  target: number | null;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Adicione registros de peso para ver a tendência.
      </p>
    );
  }
  const allValues = data.flatMap((d) => [d.weightKg, d.movingAverage ?? d.weightKg]);
  const min = Math.floor(Math.min(...allValues, target ?? Infinity)) - 1;
  const max = Math.ceil(Math.max(...allValues, target ?? -Infinity)) + 1;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickFormatter={(v) => String(v).slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, name) => {
              const value = typeof v === "number" ? v.toFixed(2) : String(v);
              return [
                `${value} kg`,
                name === "movingAverage" ? "Média 7d" : "Peso",
              ];
            }}
            labelFormatter={(label) => String(label)}
          />
          {target !== null && (
            <ReferenceLine
              y={target}
              stroke="var(--color-warning)"
              strokeDasharray="4 4"
              label={{
                value: `meta ${target}kg`,
                fill: "var(--color-warning)",
                fontSize: 10,
                position: "right",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.5}
            dot={{ r: 2 }}
            opacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

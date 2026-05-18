"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; weightKg: number };

export function WeightTrendChart({
  data,
  target,
}: {
  data: Point[];
  target: number | null;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Adicione registros de peso para ver o gráfico.
      </p>
    );
  }
  const min = Math.floor(Math.min(...data.map((d) => d.weightKg), target ?? Infinity)) - 1;
  const max = Math.ceil(Math.max(...data.map((d) => d.weightKg), target ?? -Infinity)) + 1;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickFormatter={(v) => (v as string).slice(5)}
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
            formatter={(v) => [
              `${typeof v === "number" ? v.toFixed(2) : v} kg`,
              "Peso",
            ]}
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
          <Area
            type="monotone"
            dataKey="weightKg"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#weightFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

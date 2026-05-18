import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeeklyStats } from "@/lib/trends";

type Comparison = {
  weightDelta: number | null;
  waterDelta: number | null;
  adherenceDelta: number | null;
};

export function WeeklyComparisonCard({
  current,
  previous,
  comparison,
}: {
  current: WeeklyStats;
  previous: WeeklyStats;
  comparison: Comparison;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Semana atual vs anterior</CardTitle>
        <p className="text-muted-foreground text-xs">
          {current.rangeLabel} <span className="mx-1">·</span> anterior: {previous.rangeLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row
          label="Peso médio"
          current={
            current.avgWeightKg !== null ? `${current.avgWeightKg.toFixed(2)}kg` : "—"
          }
          previous={
            previous.avgWeightKg !== null ? `${previous.avgWeightKg.toFixed(2)}kg` : "—"
          }
          delta={
            comparison.weightDelta !== null
              ? `${comparison.weightDelta > 0 ? "+" : ""}${comparison.weightDelta.toFixed(2)}kg`
              : null
          }
          deltaTone={
            comparison.weightDelta !== null
              ? comparison.weightDelta < 0
                ? "success"
                : "warning"
              : "neutral"
          }
          deltaDirection={comparison.weightDelta}
        />
        <Row
          label="Água/dia"
          current={current.avgWaterMl !== null ? `${(current.avgWaterMl / 1000).toFixed(2)}L` : "—"}
          previous={previous.avgWaterMl !== null ? `${(previous.avgWaterMl / 1000).toFixed(2)}L` : "—"}
          delta={
            comparison.waterDelta !== null
              ? `${comparison.waterDelta > 0 ? "+" : ""}${(comparison.waterDelta / 1000).toFixed(2)}L`
              : null
          }
          deltaTone={
            comparison.waterDelta !== null
              ? comparison.waterDelta > 0
                ? "success"
                : "warning"
              : "neutral"
          }
          deltaDirection={comparison.waterDelta}
        />
        <Row
          label="Aderência"
          current={
            current.adherence !== null ? `${Math.round(current.adherence * 100)}%` : "—"
          }
          previous={
            previous.adherence !== null ? `${Math.round(previous.adherence * 100)}%` : "—"
          }
          delta={
            comparison.adherenceDelta !== null
              ? `${comparison.adherenceDelta > 0 ? "+" : ""}${Math.round(
                  comparison.adherenceDelta * 100
                )}pp`
              : null
          }
          deltaTone={
            comparison.adherenceDelta !== null
              ? comparison.adherenceDelta > 0
                ? "success"
                : "warning"
              : "neutral"
          }
          deltaDirection={comparison.adherenceDelta}
        />
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  current,
  previous,
  delta,
  deltaTone,
  deltaDirection,
}: {
  label: string;
  current: string;
  previous: string;
  delta: string | null;
  deltaTone: "success" | "warning" | "neutral";
  deltaDirection: number | null;
}) {
  const Icon =
    deltaDirection === null
      ? Minus
      : Math.abs(deltaDirection) < 0.0001
      ? Minus
      : deltaDirection > 0
      ? ArrowUpRight
      : ArrowDownRight;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground w-24 shrink-0 text-xs">{label}</span>
      <div className="flex flex-1 items-baseline justify-end gap-2 font-mono tabular-nums">
        <span className="text-muted-foreground/60 text-xs">{previous}</span>
        <ArrowRight className="text-muted-foreground/40 h-3 w-3" />
        <span className="font-semibold">{current}</span>
      </div>
      {delta && (
        <span
          className={cn(
            "inline-flex w-20 items-center justify-end gap-0.5 text-xs font-medium",
            deltaTone === "success" && "text-success",
            deltaTone === "warning" && "text-warning",
            deltaTone === "neutral" && "text-muted-foreground"
          )}
        >
          <Icon className="h-3 w-3" />
          {delta}
        </span>
      )}
    </div>
  );
}

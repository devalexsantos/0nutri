import Link from "next/link";
import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeightSummary } from "@/lib/weight";

export function WeightProgressCard({ summary }: { summary: WeightSummary }) {
  const { current, initial, target, diffFromInitial, remainingToTarget, trend7d } = summary;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Scale className="text-primary h-4 w-4" /> Peso
          </span>
          <Link href="/weight" className="text-primary text-xs hover:underline">
            ver histórico
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {current === null ? (
          <p className="text-muted-foreground text-sm">
            Nenhum peso registrado ainda. <Link href="/weight" className="text-primary underline">Registrar agora</Link>.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-semibold tabular-nums">
                {current.toFixed(2)} <span className="text-muted-foreground text-base">kg</span>
              </div>
              {trend7d !== null && (
                <span
                  className={`flex items-center text-xs ${
                    trend7d > 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {trend7d > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend7d).toFixed(2)} kg (7d)
                </span>
              )}
            </div>
            <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
              <Stat label="Inicial" value={initial} suffix="kg" />
              <Stat
                label="Diferença"
                value={diffFromInitial}
                suffix="kg"
                positive={diffFromInitial !== null && diffFromInitial < 0}
              />
              <Stat
                label={target !== null && current !== null && current > target ? "Falta" : "Meta"}
                value={
                  remainingToTarget !== null && remainingToTarget > 0
                    ? remainingToTarget
                    : target
                }
                suffix="kg"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix,
  positive,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  positive?: boolean;
}) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="text-[10px] uppercase">{label}</div>
        <div className="text-foreground/50">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[10px] uppercase">{label}</div>
      <div className={`text-foreground font-medium ${positive ? "text-success" : ""}`}>
        {value > 0 ? "+" : ""}
        {value.toFixed(2)} {suffix}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DailyScore } from "@/lib/score";

export function DailyConsistencyCard({
  score,
  message,
}: {
  score: DailyScore;
  message: string;
}) {
  const ring =
    score.total >= 75
      ? "stroke-success"
      : score.total >= 50
      ? "stroke-primary"
      : score.total >= 25
      ? "stroke-warning"
      : "stroke-muted-foreground";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <ProgressRing value={score.total} ringClassName={ring} />
        <div className="flex-1 space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Consistência de hoje
          </div>
          <div className="text-sm font-medium">{message}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px]">
            <Component label="Refeições" value={score.meals} max={60} />
            <Component label="Água" value={score.water} max={30} />
            <Component label="Check-in" value={score.checkin} max={10} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Component({ label, value, max }: { label: string; value: number; max: number }) {
  const done = value >= max * 0.9;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", done && "text-success")}>
      {done ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Circle className="h-3 w-3 opacity-50" />
      )}
      <span>
        {label}: {value}/{max}
      </span>
    </span>
  );
}

function ProgressRing({
  value,
  ringClassName,
}: {
  value: number;
  ringClassName: string;
}) {
  const size = 64;
  const radius = 26;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={ringClassName}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-semibold tabular-nums leading-none">
          {value}
        </span>
        <span className="text-[9px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

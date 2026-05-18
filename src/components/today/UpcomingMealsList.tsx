"use client";

import { motion } from "framer-motion";
import { Check, Clock, MinusCircle, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealForToday } from "@/lib/meals";

const STATUS_LABEL: Record<string, { label: string; color: string; Icon: typeof Check }> = {
  done: { label: "Feita", color: "text-success", Icon: Check },
  skipped: { label: "Pulada", color: "text-muted-foreground", Icon: SkipForward },
  partial: { label: "Parcial", color: "text-warning", Icon: MinusCircle },
  pending: { label: "Pendente", color: "text-muted-foreground", Icon: Clock },
};

export function UpcomingMealsList({
  meals,
  currentMealId,
}: {
  meals: MealForToday[];
  currentMealId: string | null;
}) {
  if (meals.length === 0) return null;
  const others = meals.filter((m) => m.id !== currentMealId);
  if (others.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Demais refeições do dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {others.map((meal, idx) => {
          const status = STATUS_LABEL[meal.status] ?? STATUS_LABEL.pending;
          const Icon = status.Icon;
          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="border-border/60 flex items-center justify-between gap-3 rounded-lg border bg-background/50 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="text-muted-foreground w-12 shrink-0 font-mono text-sm">
                  {meal.scheduledAt}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{meal.name}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {meal.options[0]?.name}
                  </div>
                </div>
              </div>
              <div className={`flex shrink-0 items-center gap-1.5 text-xs ${status.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {status.label}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Clock, MinusCircle, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setMealStatus } from "@/server/actions/meals";
import type { MealForToday } from "@/lib/meals";

const STATUS_LABEL: Record<string, { label: string; color: string; Icon: typeof Check }> = {
  done: { label: "Feita", color: "text-success", Icon: Check },
  skipped: { label: "Pulada", color: "text-muted-foreground", Icon: SkipForward },
  partial: { label: "Parcial", color: "text-warning", Icon: MinusCircle },
  pending: { label: "Pendente", color: "text-muted-foreground", Icon: Clock },
};

type MarkStatus = "done" | "partial" | "skipped";

export function UpcomingMealsList({
  personaId,
  meals,
  currentMealId,
}: {
  personaId: string;
  meals: MealForToday[];
  currentMealId: string | null;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (meals.length === 0) return null;
  const others = meals.filter((m) => m.id !== currentMealId);
  if (others.length === 0) return null;

  const now = Date.now();

  function mark(meal: MealForToday, status: MarkStatus) {
    setBusyId(meal.id);
    startTransition(async () => {
      try {
        await setMealStatus({
          personaId,
          mealId: meal.id,
          status,
          mealOptionId:
            status === "skipped" ? null : meal.mealOptionId ?? meal.options[0]?.id ?? null,
        });
        toast.success(
          status === "done"
            ? "Refeição marcada como feita."
            : status === "partial"
              ? "Marcada como parcial."
              : "Refeição pulada."
        );
      } catch (err) {
        toast.error("Não foi possível salvar.");
        console.error(err);
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Demais refeições do dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {others.map((meal, idx) => {
          const status = STATUS_LABEL[meal.status] ?? STATUS_LABEL.pending;
          const Icon = status.Icon;
          const isPastPending =
            meal.status === "pending" && meal.scheduledDate.getTime() < now;
          const busy = busyId === meal.id;
          return (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className={
                isPastPending
                  ? "border-warning/50 bg-warning/5 rounded-lg border p-3"
                  : "border-border/60 bg-background/50 rounded-lg border p-3"
              }
            >
              <div className="flex items-center justify-between gap-3">
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
                {isPastPending ? (
                  <div className="text-warning flex shrink-0 items-center gap-1.5 text-xs font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Atrasada
                  </div>
                ) : (
                  <div
                    className={`flex shrink-0 items-center gap-1.5 text-xs ${status.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {status.label}
                  </div>
                )}
              </div>

              {isPastPending && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => mark(meal, "done")}
                    className="h-9"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Feita
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => mark(meal, "partial")}
                    className="h-9"
                  >
                    <MinusCircle className="mr-1 h-3.5 w-3.5" /> Parcial
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => mark(meal, "skipped")}
                    className="h-9"
                  >
                    <SkipForward className="mr-1 h-3.5 w-3.5" /> Pular
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

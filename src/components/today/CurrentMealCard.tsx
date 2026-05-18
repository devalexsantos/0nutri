"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, RefreshCw, SkipForward, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setMealStatus } from "@/server/actions/meals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MealForToday } from "@/lib/meals";

type Status = "done" | "skipped" | "partial";

const FEELING_OPTIONS = [
  { value: "tranquilo", label: "Tranquilo" },
  { value: "fiquei_com_fome", label: "Fiquei com fome" },
  { value: "comi_mais", label: "Comi mais que deveria" },
  { value: "troquei", label: "Troquei por outra coisa" },
  { value: "nao_consegui", label: "Não consegui fazer" },
];

export function CurrentMealCard({
  personaId,
  meal,
  timing,
  late,
}: {
  personaId: string;
  meal: MealForToday;
  timing: string;
  late: boolean;
}) {
  const [selectedOption, setSelectedOption] = useState<string>(
    meal.mealOptionId ?? meal.options[0]?.id ?? ""
  );
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [hungerLevel, setHungerLevel] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<string>("");
  const [saving, startTransition] = useTransition();

  function quickMark(status: Status) {
    // Pula o painel adicional, salva direto
    startTransition(async () => {
      try {
        await setMealStatus({
          personaId,
          mealId: meal.id,
          status,
          mealOptionId: status === "done" || status === "partial" ? selectedOption : null,
        });
        toast.success(
          status === "done"
            ? "Refeição marcada como feita."
            : status === "skipped"
            ? "Refeição pulada."
            : "Marcada como parcialmente feita."
        );
      } catch (err) {
        toast.error("Não foi possível salvar.");
        console.error(err);
      }
    });
  }

  function openDetailedMark(status: Status) {
    setPendingStatus(status);
    setHungerLevel(null);
    setFeeling("");
  }

  function confirmDetailed() {
    if (!pendingStatus) return;
    const status = pendingStatus;
    startTransition(async () => {
      try {
        await setMealStatus({
          personaId,
          mealId: meal.id,
          status,
          mealOptionId: status === "done" || status === "partial" ? selectedOption : null,
          hungerLevel: hungerLevel ?? undefined,
          feeling: feeling || undefined,
        });
        toast.success(
          status === "done"
            ? "Refeição marcada como feita."
            : status === "skipped"
            ? "Refeição pulada."
            : "Marcada como parcialmente feita."
        );
        setPendingStatus(null);
      } catch (err) {
        toast.error("Não foi possível salvar.");
        console.error(err);
      }
    });
  }

  return (
    <Card className="border-primary/20 bg-card relative overflow-hidden">
      <div className="bg-primary absolute top-0 left-0 h-full w-1.5" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Utensils className="text-primary h-5 w-5" />
            <CardTitle className="text-lg">{meal.name}</CardTitle>
          </div>
          <Badge variant={late ? "destructive" : "secondary"} className="shrink-0">
            <Clock className="mr-1 h-3 w-3" /> {meal.scheduledAt} · {timing}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {meal.options.length > 1 && (
          <div className="grid gap-2">
            <div className="text-muted-foreground text-xs font-medium uppercase">
              Escolha uma opção
            </div>
            <div className="flex flex-wrap gap-2">
              {meal.options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedOption === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {meal.options
          .filter((o) => o.id === selectedOption)
          .map((opt) => (
            <ul key={opt.id} className="space-y-1.5 text-sm">
              {opt.foodItems.map((f) => (
                <li key={f.id} className="flex items-start gap-2">
                  <div className="bg-primary/40 mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span>
                    {f.name}
                    {f.quantity != null && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {f.quantity}
                        {f.unit ? ` ${f.unit}` : ""}
                      </span>
                    )}
                    {f.notes && (
                      <span className="text-muted-foreground italic"> ({f.notes})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ))}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            size="lg"
            disabled={saving}
            onClick={() => quickMark("done")}
            className="h-11"
          >
            <Check className="mr-1 h-4 w-4" /> Feita
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={saving}
            onClick={() => quickMark("partial")}
            className="h-11"
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Parcial
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={saving}
            onClick={() => quickMark("skipped")}
            className="h-11"
          >
            <SkipForward className="mr-1 h-4 w-4" /> Pular
          </Button>
        </div>

        <button
          type="button"
          onClick={() => openDetailedMark("done")}
          className="text-muted-foreground hover:text-foreground block w-full text-center text-xs underline"
        >
          marcar com humor/fome
        </button>

        <AnimatePresence>
          {pendingStatus && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-border/60 mt-2 space-y-3 rounded-lg border p-3">
                <div>
                  <div className="text-muted-foreground mb-1.5 text-xs">
                    Marcando como{" "}
                    <strong>
                      {pendingStatus === "done"
                        ? "feita"
                        : pendingStatus === "partial"
                        ? "parcial"
                        : "pulada"}
                    </strong>
                  </div>
                  <div className="flex gap-1.5">
                    {(["done", "partial", "skipped"] as Status[]).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setPendingStatus(s)}
                        className={cn(
                          "h-7 flex-1 rounded-md border text-xs",
                          pendingStatus === s
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {s === "done" ? "feita" : s === "partial" ? "parcial" : "pulada"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1.5 text-xs">Fome antes (1–5)</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setHungerLevel(n)}
                        className={cn(
                          "h-9 flex-1 rounded-md border text-sm font-semibold",
                          hungerLevel === n
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground mb-1.5 text-xs">Como foi essa refeição?</div>
                  <div className="grid grid-cols-1 gap-1">
                    {FEELING_OPTIONS.map((f) => (
                      <button
                        type="button"
                        key={f.value}
                        onClick={() => setFeeling(f.value)}
                        className={cn(
                          "h-8 rounded-md border px-2.5 text-left text-xs transition-colors",
                          feeling === f.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingStatus(null)}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={confirmDetailed} disabled={saving} className="flex-1" size="sm">
                    Salvar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

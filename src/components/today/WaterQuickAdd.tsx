"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logWater } from "@/server/actions/water";
import { toast } from "sonner";

const QUICK_VALUES = [200, 300, 500, 700];

export function WaterQuickAdd({
  personaId,
  consumedMl,
  goalMl,
  feedback,
}: {
  personaId: string;
  consumedMl: number;
  goalMl: number;
  feedback: { tone: "good" | "behind" | "great" | "neutral"; message: string };
}) {
  const [pending, startTransition] = useTransition();
  const progress = Math.min(100, Math.round((consumedMl / goalMl) * 100));

  function add(amountMl: number) {
    startTransition(async () => {
      try {
        await logWater({ personaId, amountMl });
        toast.success(`+${amountMl}ml registrados`);
      } catch (err) {
        toast.error("Não foi possível salvar.");
        console.error(err);
      }
    });
  }

  const toneColor =
    feedback.tone === "behind"
      ? "text-warning"
      : feedback.tone === "great"
      ? "text-success"
      : "text-muted-foreground";

  return (
    <Card className="border-l-water border-l-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Droplet className="text-water h-4 w-4" /> Água
          </span>
          <span className="text-water font-mono text-sm font-semibold">
            {(consumedMl / 1000).toFixed(2)}L
            <span className="text-muted-foreground"> / {(goalMl / 1000).toFixed(1)}L</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted relative h-2 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-water h-full rounded-full"
          />
        </div>
        <p className={`text-xs ${toneColor}`}>{feedback.message}</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_VALUES.map((v) => (
            <Button
              key={v}
              variant="outline"
              size="sm"
              className="border-water/30 text-water hover:bg-water/10 h-11"
              disabled={pending}
              onClick={() => add(v)}
            >
              +{v}ml
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

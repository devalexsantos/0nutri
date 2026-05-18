"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { generateWeeklyReview } from "@/server/actions/ai-coach";
import type { WeeklyReview } from "@/schemas/ai-coach";

export function CoachClient({
  personaId,
  openAiConfigured,
}: {
  personaId: string;
  openAiConfigured: boolean;
}) {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    if (!openAiConfigured) {
      toast.error("Configure OPENAI_API_KEY primeiro.");
      return;
    }
    startTransition(async () => {
      try {
        const out = await generateWeeklyReview(personaId);
        setReview(out);
        toast.success("Resumo semanal pronto.");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Falha ao gerar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        onClick={generate}
        disabled={pending || !openAiConfigured}
        className="h-12 w-full text-base"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        {pending ? "Analisando últimos 7 dias…" : "Gerar resumo semanal"}
      </Button>

      {review && <WeeklyReviewCard review={review} />}
    </div>
  );
}

function WeeklyReviewCard({ review }: { review: WeeklyReview }) {
  const borderTone =
    review.overallTone === "positivo"
      ? "border-success/40 bg-success/5"
      : review.overallTone === "atencao"
      ? "border-warning/40 bg-warning/5"
      : "border-info/40 bg-info/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={borderTone}>
        <CardContent className="space-y-5 py-5">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-1.5 text-[10px]">
                Resumo da semana
              </Badge>
              <h3 className="text-base font-semibold">{review.headline}</h3>
            </div>
          </div>

          <Section
            icon={CheckCircle2}
            iconColor="text-success"
            title="Pontos positivos"
            items={review.highlights}
          />

          {review.attentions.length > 0 && (
            <Section
              icon={AlertTriangle}
              iconColor="text-warning"
              title="Atenção"
              items={review.attentions}
            />
          )}

          {review.patterns.length > 0 && (
            <Section
              icon={Sparkles}
              iconColor="text-info"
              title="Padrões detectados"
              items={review.patterns}
            />
          )}

          <Section
            icon={Lightbulb}
            iconColor="text-primary"
            title="Para a próxima semana"
            items={review.suggestionsForNextWeek}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  iconColor,
  title,
  items,
}: {
  icon: typeof Sparkles;
  iconColor: string;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${iconColor}`}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <ul className="space-y-1 pl-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="bg-foreground/30 mt-2 h-1 w-1 shrink-0 rounded-full" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Loader2, Timer, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { generateDietVariant, importAiDiet } from "@/server/actions/ai-diet";
import type { AiDietOutput } from "@/schemas/ai-diet";

type Variant = "economica" | "rapida";

export function DietVariantButtons({ personaId }: { personaId: string }) {
  const router = useRouter();
  const [generating, startGenerate] = useTransition();
  const [importing, startImport] = useTransition();
  const [currentVariant, setCurrentVariant] = useState<Variant | null>(null);
  const [preview, setPreview] = useState<{ id: string; data: AiDietOutput } | null>(null);

  function generate(variant: Variant) {
    setCurrentVariant(variant);
    setPreview(null);
    startGenerate(async () => {
      try {
        const res = await generateDietVariant({ personaId, variant });
        setPreview({ id: res.generationId, data: res.output });
        toast.success("Variante pronta — revise antes de importar.");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Falha ao gerar.");
      }
    });
  }

  function applyImport(activate: boolean) {
    if (!preview) return;
    startImport(async () => {
      try {
        await importAiDiet(preview.id, activate);
        toast.success(activate ? "Variante ativa." : "Variante salva como rascunho.");
        setPreview(null);
        setCurrentVariant(null);
        router.push("/diet");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Falha ao importar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="text-primary h-4 w-4" /> Gerar variante da dieta com IA
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          Mantém a estrutura (refeições/horários) e troca opções e quantidades.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            onClick={() => generate("economica")}
            disabled={generating || importing}
            variant="outline"
            className="h-12"
          >
            {generating && currentVariant === "economica" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="mr-2 h-4 w-4" />
            )}
            Versão econômica
          </Button>
          <Button
            onClick={() => generate("rapida")}
            disabled={generating || importing}
            variant="outline"
            className="h-12"
          >
            {generating && currentVariant === "rapida" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Timer className="mr-2 h-4 w-4" />
            )}
            Versão rápida de preparo
          </Button>
        </div>

        {preview && (
          <div className="border-primary/30 bg-primary/5 space-y-3 rounded-lg border p-3">
            <div>
              <Badge variant="secondary" className="mb-1 text-[10px]">
                {currentVariant === "economica" ? "Econômica" : "Rápida"}
              </Badge>
              <div className="text-sm font-semibold">{preview.data.dietName}</div>
              <div className="text-muted-foreground text-xs">{preview.data.objective}</div>
            </div>

            <div className="space-y-2">
              {preview.data.meals.slice(0, 4).map((meal, i) => (
                <div key={i} className="bg-background rounded-md border p-2 text-xs">
                  <div className="font-medium">
                    {meal.name} <span className="text-muted-foreground">· {meal.scheduledAt}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {meal.options[0]?.foodItems
                      .map((f) => `${f.name}${f.quantity ? ` ${f.quantity}${f.unit ?? ""}` : ""}`)
                      .join(", ")}
                  </div>
                </div>
              ))}
              {preview.data.meals.length > 4 && (
                <div className="text-muted-foreground text-center text-xs">
                  + {preview.data.meals.length - 4} refeições
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => applyImport(true)} disabled={importing} size="sm" className="flex-1">
                Importar e ativar
              </Button>
              <Button
                onClick={() => applyImport(false)}
                disabled={importing}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Salvar rascunho
              </Button>
              <Button
                onClick={() => setPreview(null)}
                disabled={importing}
                size="sm"
                variant="ghost"
              >
                Descartar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

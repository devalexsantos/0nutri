import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AiDietWizard } from "@/components/ai-diet/AiDietWizard";
import { getActivePersona } from "@/lib/persona";
import { isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import type { NutritionProfileInput } from "@/schemas/nutrition-profile";

export const dynamic = "force-dynamic";

export default async function AiDietPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Montar Dieta com IA</h1>
        <Card>
          <CardContent className="py-6 text-center text-sm">
            Crie uma persona em <Link href="/personas" className="text-primary underline">Personas</Link> para começar.
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = await prisma.nutritionProfile.findUnique({
    where: { personaId: persona.id },
  });

  const initialProfile: NutritionProfileInput = {
    wakeTime: profile?.wakeTime ?? null,
    sleepTime: profile?.sleepTime ?? null,
    workRoutine: profile?.workRoutine ?? null,
    trainingRoutine: profile?.trainingRoutine ?? null,
    desiredMealsPerDay: profile?.desiredMealsPerDay ?? null,
    mainDifficulty: (profile?.mainDifficulty as never) ?? null,
    foodPreferences: profile?.foodPreferences ?? [],
    dislikedFoods: profile?.dislikedFoods ?? [],
    allergies: profile?.allergies ?? [],
    intolerances: profile?.intolerances ?? [],
    medicalRestrictions: profile?.medicalRestrictions ?? null,
    budgetLevel: (profile?.budgetLevel as never) ?? null,
    preparationPreference: (profile?.preparationPreference as never) ?? null,
    preferredFoods: profile?.preferredFoods ?? [],
    showCalories: profile?.showCalories ?? false,
    showMacros: profile?.showMacros ?? false,
    includeShoppingList: profile?.includeShoppingList ?? true,
  };

  const recentGenerations = await prisma.aiDietGeneration.findMany({
    where: { personaId: persona.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary h-5 w-5" />
          <h1 className="text-2xl font-semibold">Montar Dieta com IA</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Responda algumas perguntas e a OpenAI monta um plano alimentar para <strong>{persona.name}</strong>.
          Você revisa antes de importar.
        </p>
        <div className="border-info/30 bg-info/10 mt-2 flex items-start gap-2 rounded-lg border p-3 text-xs">
          <AlertTriangle className="text-info mt-0.5 h-4 w-4 shrink-0" />
          <p>
            A dieta gerada por IA é uma sugestão de organização pessoal. Condições médicas exigem
            acompanhamento profissional.
          </p>
        </div>
      </div>

      <AiDietWizard
        personaId={persona.id}
        personaName={persona.name}
        openAiConfigured={isOpenAIConfigured()}
        initialProfile={initialProfile}
      />

      {recentGenerations.length > 0 && (
        <div>
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">Histórico recente</h2>
          <ul className="space-y-1.5">
            {recentGenerations.map((g) => (
              <li
                key={g.id}
                className="border-border/60 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {g.status === "imported"
                      ? "Importada"
                      : g.status === "error"
                      ? "Falhou"
                      : "Rascunho"}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}— {g.createdAt.toLocaleString("pt-BR")}
                  </span>
                </span>
                {g.errorMessage && (
                  <span className="text-destructive text-xs">{g.errorMessage}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

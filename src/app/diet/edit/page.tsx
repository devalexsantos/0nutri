import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DietEditor } from "@/components/diet/DietEditor";
import { getActiveDietForPersona } from "@/lib/meals";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DietEditPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const activeDiet = await getActiveDietForPersona(persona.id);
  const allDiets = await prisma.diet.findMany({
    where: { personaId: persona.id },
    orderBy: { createdAt: "desc" },
  });

  if (!activeDiet) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editor de dieta</h1>
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm">
              Nenhuma dieta ativa. A forma mais rápida de começar é deixar a IA gerar um plano:
            </p>
            <Button asChild>
              <Link href="/ai-diet">
                <Sparkles className="mr-2 h-4 w-4" /> Montar com IA
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Editor de dieta</h1>
        <p className="text-muted-foreground text-sm">
          Ajuste refeições, opções e alimentos da dieta ativa de {persona.name}.
        </p>
      </div>
      <DietEditor
        diet={{
          id: activeDiet.id,
          name: activeDiet.name,
          description: activeDiet.description,
          meals: activeDiet.meals.map((m) => ({
            id: m.id,
            name: m.name,
            scheduledAt: m.scheduledAt,
            description: m.description,
            options: m.options.map((o) => ({
              id: o.id,
              name: o.name,
              description: o.description,
              foodItems: o.foodItems.map((f) => ({
                id: f.id,
                name: f.name,
                quantity: f.quantity,
                unit: f.unit,
              })),
            })),
          })),
        }}
        otherDiets={allDiets
          .filter((d) => d.id !== activeDiet.id)
          .map((d) => ({ id: d.id, name: d.name }))}
        personaId={persona.id}
      />
    </div>
  );
}

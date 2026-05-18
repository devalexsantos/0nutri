import Link from "next/link";
import { Edit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveDietForPersona } from "@/lib/meals";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DietPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const diet = await getActiveDietForPersona(persona.id);
  const inactiveDiets = await prisma.diet.findMany({
    where: { personaId: persona.id, isActive: false },
    orderBy: { createdAt: "desc" },
  });

  if (!diet) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Dieta</h1>
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm">Nenhuma dieta ativa.</p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/ai-diet">
                  <Sparkles className="mr-2 h-4 w-4" /> Montar com IA
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/diet/edit">Cadastrar manualmente</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{diet.name}</h1>
          {diet.description && (
            <p className="text-muted-foreground text-sm">{diet.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Persona: {persona.name}</Badge>
            <Badge>Ativa</Badge>
            <Badge variant="outline">{diet.meals.length} refeições</Badge>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/diet/edit">
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {diet.meals.map((meal) => (
          <Card key={meal.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{meal.name}</span>
                <span className="text-muted-foreground font-mono text-sm">
                  {meal.scheduledAt}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meal.options.map((opt) => (
                <div key={opt.id} className="border-border/60 rounded-lg border p-3">
                  <div className="mb-1.5 text-sm font-medium">{opt.name}</div>
                  <ul className="space-y-1 text-sm">
                    {opt.foodItems.map((f) => (
                      <li key={f.id} className="flex items-start gap-2">
                        <div className="bg-primary/40 mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <span>
                          {f.name}
                          {f.quantity != null && (
                            <span className="text-muted-foreground">
                              {" "}— {f.quantity}{f.unit ? ` ${f.unit}` : ""}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {inactiveDiets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outras dietas salvas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveDiets.map((d) => (
              <div
                key={d.id}
                className="border-border/60 flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span>{d.name}</span>
                <Link href="/diet/edit" className="text-primary text-xs hover:underline">
                  gerenciar
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

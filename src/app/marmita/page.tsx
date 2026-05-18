import Link from "next/link";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarmitaPlanner } from "@/components/marmita/MarmitaPlanner";
import { isoDate } from "@/lib/dates";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MarmitaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const { week } = await searchParams;
  const baseDate = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? new Date(week) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekStartIso = isoDate(weekStart);
  const prevWeek = isoDate(subWeeks(weekStart, 1));
  const nextWeek = isoDate(addWeeks(weekStart, 1));

  const preps = await prisma.mealPrep.findMany({
    where: {
      personaId: persona.id,
      weekStartDate: new Date(weekStartIso),
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <UtensilsCrossed className="h-5 w-5" /> Modo marmita
        </h1>
        <p className="text-muted-foreground text-sm">
          Planeje marmitas da semana com porções, proteína, carbo e legumes.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/marmita?week=${prevWeek}`}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Semana anterior
          </Link>
        </Button>
        <div className="text-center">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Semana</div>
          <div className="text-sm font-medium">
            {format(weekStart, "dd 'de' MMM", { locale: ptBR })} —{" "}
            {format(addWeeks(weekStart, 1), "dd 'de' MMM", { locale: ptBR })}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/marmita?week=${nextWeek}`}>
            Próxima <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {preps.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Nenhuma marmita planejada para essa semana ainda.
          </CardContent>
        </Card>
      )}

      <MarmitaPlanner
        personaId={persona.id}
        weekStartIso={weekStartIso}
        preps={preps.map((p) => ({
          id: p.id,
          name: p.name,
          portions: p.portions,
          protein: p.protein,
          carb: p.carb,
          vegetables: p.vegetables,
          notes: p.notes,
          done: p.done,
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import { subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isoDate } from "@/lib/dates";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em{" "}
        <Link href="/personas" className="text-primary underline">
          Personas
        </Link>
        .
      </p>
    );
  }

  const summaries = await prisma.dailySummary.findMany({
    where: {
      personaId: persona.id,
      date: { gte: subDays(new Date(), 30) },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          Últimos 30 dias de {persona.name}. Clique em um dia para detalhes.
        </p>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Use o app por alguns dias para começar a acumular histórico.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {summaries.map((s) => {
            const iso = isoDate(s.date);
            return (
              <Link
                key={s.id}
                href={`/today/${iso}`}
                className="border-border/60 hover:bg-muted block rounded-xl border bg-card p-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{iso}</div>
                    <div className="text-muted-foreground text-xs">
                      Refeições: {s.mealsScore ?? 0}/60 · Água: {s.waterScore ?? 0}/30
                      {s.energyLevel || s.moodLevel || s.hungerLevel ? " · check-in feito" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-semibold tabular-nums ${
                        (s.overallScore ?? 0) >= 75
                          ? "text-success"
                          : (s.overallScore ?? 0) >= 50
                          ? "text-primary"
                          : (s.overallScore ?? 0) >= 25
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.overallScore ?? 0}
                    </div>
                    <div className="text-muted-foreground text-[10px]">/ 100</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

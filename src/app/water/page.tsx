import Link from "next/link";
import { Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WaterQuickAdd } from "@/components/today/WaterQuickAdd";
import { WaterCustomAmount } from "@/components/water/WaterCustomAmount";
import { WaterLogList } from "@/components/water/WaterLogList";
import { getActivePersona } from "@/lib/persona";
import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getTodayWaterIntake, waterFeedback } from "@/lib/water";

export const dynamic = "force-dynamic";

export default async function WaterPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const now = new Date();
  const todayIso = isoDate(now);
  const consumedMl = await getTodayWaterIntake(persona.id, now);
  const logs = await prisma.waterLog.findMany({
    where: { personaId: persona.id, date: new Date(todayIso) },
    orderBy: { loggedAt: "desc" },
  });

  // últimos 7 dias agregados
  const last7Days = await prisma.$queryRaw<
    Array<{ d: string; total: number }>
  >`SELECT to_char(date, 'YYYY-MM-DD') AS d, SUM("amountMl")::int AS total
    FROM "WaterLog"
    WHERE "personaId" = ${persona.id}
    AND date >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY date
    ORDER BY date DESC`;

  const feedback = waterFeedback(consumedMl, persona.dailyWaterMl, now);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Água</h1>
        <p className="text-muted-foreground text-sm">
          Registre seu consumo. A meta de {(persona.dailyWaterMl / 1000).toFixed(1)}L pode ser ajustada na persona.
        </p>
      </div>

      <WaterQuickAdd
        personaId={persona.id}
        consumedMl={consumedMl}
        goalMl={persona.dailyWaterMl}
        feedback={feedback}
      />

      <WaterCustomAmount personaId={persona.id} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterLogList logs={logs.map((l) => ({
            id: l.id,
            amountMl: l.amountMl,
            loggedAt: l.loggedAt.toISOString(),
          }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplet className="text-water h-4 w-4" /> Últimos 7 dias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {last7Days.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem registros recentes.</p>
          ) : (
            last7Days.map((d) => {
              const total = Number(d.total);
              const pct = Math.min(100, Math.round((total / persona.dailyWaterMl) * 100));
              return (
                <div key={d.d} className="space-y-1">
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>{d.d}</span>
                    <span className="font-mono">{(total / 1000).toFixed(2)}L · {pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

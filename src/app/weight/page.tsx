import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightForm } from "@/components/weight/WeightForm";
import { WeightLogTable } from "@/components/weight/WeightLogTable";
import { WeightTrendChart } from "@/components/weight/WeightTrendChart";
import { WeightProgressCard } from "@/components/today/WeightProgressCard";
import { getActivePersona } from "@/lib/persona";
import { isoDate } from "@/lib/dates";
import { getWeightLogs, getWeightSummary } from "@/lib/weight";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const logs = await getWeightLogs(persona.id, 50);
  const summary = await getWeightSummary(persona.id, persona.initialWeightKg, persona.targetWeightKg);

  const chartData = [...logs]
    .reverse()
    .map((l) => ({ date: isoDate(l.date), weightKg: l.weightKg }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Peso</h1>
        <p className="text-muted-foreground text-sm">
          Registre regularmente. O peso real conta menos que a tendência ao longo do tempo.
        </p>
      </div>

      <WeightProgressCard summary={summary} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registrar peso</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightForm personaId={persona.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Evolução</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightTrendChart data={chartData} target={persona.targetWeightKg} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightLogTable
            logs={logs.map((l) => ({
              id: l.id,
              date: isoDate(l.date),
              weightKg: l.weightKg,
              notes: l.notes,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Activity, Bot, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { featureLabel, getAiUsage } from "@/lib/ai-usage";
import { getActivePersona } from "@/lib/persona";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const { days: daysParam } = await searchParams;
  const days = daysParam && /^\d+$/.test(daysParam) ? Math.min(365, Number(daysParam)) : 30;
  const usage = await getAiUsage(persona.id, days);

  const maxCount = Math.max(1, ...usage.byType.map((b) => b.count));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Activity className="h-5 w-5" /> Uso da IA
        </h1>
        <p className="text-muted-foreground text-sm">
          Tokens consumidos por feature de IA nos últimos {days} dias para {persona.name}.
          Preço baseado em <code className="bg-muted rounded px-1">gpt-4o-mini</code>.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[7, 30, 90, 365].map((d) => (
            <Link
              key={d}
              href={`/usage?days=${d}`}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                days === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {d === 365 ? "1 ano" : `${d}d`}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Gerações"
          value={usage.total.count.toString()}
          icon={Bot}
        />
        <StatCard
          label="Tokens entrada"
          value={usage.total.tokensIn.toLocaleString("pt-BR")}
          icon={Bot}
        />
        <StatCard
          label="Tokens saída"
          value={usage.total.tokensOut.toLocaleString("pt-BR")}
          icon={Bot}
        />
        <StatCard
          label="Custo estimado"
          value={`US$ ${usage.total.costUsd.toFixed(4)}`}
          icon={Bot}
          tone={usage.total.costUsd > 1 ? "warning" : "default"}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Por feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {usage.byType.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma geração de IA no período.
            </p>
          ) : (
            usage.byType.map((b) => (
              <div key={b.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{featureLabel(b.type)}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {b.count}× · {(b.tokensIn + b.tokensOut).toLocaleString("pt-BR")} tokens
                    {b.costUsd !== null && (
                      <> · US$ {b.costUsd.toFixed(4)}</>
                    )}
                  </span>
                </div>
                <Progress value={(b.count / maxCount) * 100} className="h-1.5" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimas gerações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {usage.recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nada por aqui.</p>
          ) : (
            usage.recent.map((r) => (
              <div
                key={r.id}
                className="border-border/60 flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {featureLabel(r.type)}
                    </Badge>
                  </div>
                  <div className="mt-1 truncate">{r.summary ?? "—"}</div>
                  <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    {r.createdAt.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-muted-foreground font-mono">
                    {(r.tokensIn ?? 0) + (r.tokensOut ?? 0)} tok
                  </div>
                  {r.costUsd !== null && (
                    <div className="text-muted-foreground font-mono">
                      US$ {r.costUsd.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            tone === "warning"
              ? "bg-warning/15 text-warning"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
            {label}
          </div>
          <div className="font-mono text-base font-semibold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

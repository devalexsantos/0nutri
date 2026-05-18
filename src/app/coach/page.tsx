import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachClient } from "@/components/coach/CoachClient";
import { getActivePersona } from "@/lib/persona";
import { isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const reports = await prisma.aiCoachReport.findMany({
    where: { personaId: persona.id, type: "weekly_review" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bot className="text-primary h-5 w-5" />
          <h1 className="text-2xl font-semibold">Coach IA</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Resumo semanal com análise de padrões para <strong>{persona.name}</strong>.
          A IA olha os últimos 7 dias e gera observações específicas (não genéricas).
        </p>
      </div>

      {!isOpenAIConfigured() && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="text-warning py-3 text-xs">
            OPENAI_API_KEY não configurada. Adicione a chave no <code>.env</code>.
          </CardContent>
        </Card>
      )}

      <CoachClient personaId={persona.id} openAiConfigured={isOpenAIConfigured()} />

      {reports.length > 0 && (
        <div>
          <h2 className="text-muted-foreground mb-2 text-sm font-medium">
            Histórico recente
          </h2>
          <div className="space-y-2">
            {reports.map((r) => {
              const data = r.outputJson as {
                headline?: string;
                overallTone?: string;
              };
              return (
                <Card key={r.id}>
                  <CardContent className="flex items-start gap-3 py-3 text-sm">
                    <Sparkles className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.summary ?? data.headline}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.createdAt.toLocaleString("pt-BR")}
                        {r.periodStart && r.periodEnd && (
                          <>
                            {" "}— {r.periodStart.toISOString().slice(0, 10)} a{" "}
                            {r.periodEnd.toISOString().slice(0, 10)}
                          </>
                        )}
                      </div>
                    </div>
                    {data.overallTone && (
                      <Badge
                        variant={
                          data.overallTone === "positivo"
                            ? "default"
                            : data.overallTone === "atencao"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {data.overallTone}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

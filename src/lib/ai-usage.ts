import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

// Preços por 1M tokens, em USD. Atualizar quando houver mudança.
// Fonte: OpenAI pricing (gpt-4o-mini). Esses são valores aproximados.
export const PRICING_PER_1M = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
} as const;

export function estimateCostUsd(model: string | null, tokensIn: number, tokensOut: number) {
  const price = (PRICING_PER_1M as Record<string, { input: number; output: number }>)[
    model ?? "gpt-4o-mini"
  ];
  if (!price) return null;
  return (tokensIn / 1_000_000) * price.input + (tokensOut / 1_000_000) * price.output;
}

export type AiUsageByType = {
  type: string;
  count: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number | null;
};

export type AiUsageReport = {
  byType: AiUsageByType[];
  total: {
    count: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
  };
  recent: Array<{
    id: string;
    type: string;
    summary: string | null;
    createdAt: Date;
    tokensIn: number | null;
    tokensOut: number | null;
    costUsd: number | null;
  }>;
};

const FEATURE_LABEL: Record<string, string> = {
  weekly_review: "Resumo semanal",
  substitutions: "Substituições de refeição",
  smart_shopping: "Lista de compras IA",
  ai_diet: "Montar dieta com IA",
  diet_variant: "Variante de dieta",
};

export async function getAiUsage(personaId: string, days: number = 30): Promise<AiUsageReport> {
  const since = subDays(new Date(), days);

  const [coachReports, dietGenerations] = await Promise.all([
    prisma.aiCoachReport.findMany({
      where: { personaId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aiDietGeneration.findMany({
      where: { personaId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const buckets = new Map<string, AiUsageByType>();
  const recent: AiUsageReport["recent"] = [];

  for (const r of coachReports) {
    const type = r.type;
    const b = buckets.get(type) ?? { type, count: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
    b.count++;
    b.tokensIn += r.tokensIn ?? 0;
    b.tokensOut += r.tokensOut ?? 0;
    const cost = estimateCostUsd(r.model, r.tokensIn ?? 0, r.tokensOut ?? 0);
    b.costUsd = (b.costUsd ?? 0) + (cost ?? 0);
    buckets.set(type, b);

    recent.push({
      id: r.id,
      type,
      summary: r.summary,
      createdAt: r.createdAt,
      tokensIn: r.tokensIn,
      tokensOut: r.tokensOut,
      costUsd: cost,
    });
  }

  for (const g of dietGenerations) {
    const type = g.promptVersion?.includes("variant") ? "diet_variant" : "ai_diet";
    const b = buckets.get(type) ?? { type, count: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
    b.count++;
    b.tokensIn += g.tokensIn ?? 0;
    b.tokensOut += g.tokensOut ?? 0;
    const cost = estimateCostUsd(g.model, g.tokensIn ?? 0, g.tokensOut ?? 0);
    b.costUsd = (b.costUsd ?? 0) + (cost ?? 0);
    buckets.set(type, b);

    recent.push({
      id: g.id,
      type,
      summary:
        type === "diet_variant"
          ? "Variante de dieta"
          : g.status === "imported"
          ? "Dieta importada"
          : g.status === "error"
          ? "Erro de geração"
          : "Dieta em rascunho",
      createdAt: g.createdAt,
      tokensIn: g.tokensIn,
      tokensOut: g.tokensOut,
      costUsd: cost,
    });
  }

  const byType = [...buckets.values()].sort((a, b) => b.count - a.count);
  const total = byType.reduce(
    (acc, b) => ({
      count: acc.count + b.count,
      tokensIn: acc.tokensIn + b.tokensIn,
      tokensOut: acc.tokensOut + b.tokensOut,
      costUsd: acc.costUsd + (b.costUsd ?? 0),
    }),
    { count: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 }
  );

  recent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return { byType, total, recent: recent.slice(0, 20) };
}

export function featureLabel(type: string): string {
  return FEATURE_LABEL[type] ?? type;
}

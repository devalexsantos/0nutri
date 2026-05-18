import { z } from "zod";

// ---- Resumo semanal ----
export const weeklyReviewSchema = z.object({
  headline: z.string().describe("Frase curta motivacional sobre a semana"),
  highlights: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Pontos positivos da semana, redação direta"),
  attentions: z
    .array(z.string())
    .min(0)
    .max(5)
    .describe("Pontos de melhoria, sem julgamento"),
  patterns: z
    .array(z.string())
    .min(0)
    .max(5)
    .describe("Padrões detectados (ex: 'aderência melhor nos dias com café')"),
  suggestionsForNextWeek: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Sugestões acionáveis e específicas para a próxima semana"),
  overallTone: z
    .enum(["positivo", "neutro", "atencao"])
    .describe("Como classificar o tom geral da semana"),
});

export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;

// ---- Substituições por refeição ----
export const substitutionItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  rationale: z.string().describe("Por que essa substituição funciona"),
  foodItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
      })
    )
    .min(1),
});

export const substitutionsSchema = z.object({
  alternatives: z.array(substitutionItemSchema).min(1).max(3),
});

export type Substitutions = z.infer<typeof substitutionsSchema>;

// ---- Lista de compras semanal com IA ----
export const smartShoppingSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string().describe("Quantidade com unidade prática, ex '1.5kg', '12 unidades', '500ml'"),
        category: z
          .enum(["proteina", "carb", "verdura", "fruta", "laticinio", "outros"])
          .describe("Categoria do alimento"),
        rationale: z.string().nullable().describe("Curta justificativa opcional"),
      })
    )
    .min(3)
    .max(40),
  notes: z.array(z.string()).max(5).default([]),
});

export type SmartShopping = z.infer<typeof smartShoppingSchema>;

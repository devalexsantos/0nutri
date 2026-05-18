import { z } from "zod";

export const aiFoodItemSchema = z.object({
  name: z.string().describe("Nome do alimento, ex: 'arroz cozido'"),
  quantity: z
    .number()
    .nullable()
    .describe("Quantidade numérica. Null se for 'à vontade'."),
  unit: z
    .string()
    .nullable()
    .describe("Unidade da quantidade: g, ml, unidades, colher, xícara, etc. Null se quantity for null."),
});

export const aiMealOptionSchema = z.object({
  name: z.string().describe("Nome da opção, ex: 'Opção 1 — Ovos e pão'"),
  calories: z.number().int().nullable().describe("Calorias estimadas (kcal). Null se preferir não informar."),
  proteinGrams: z.number().nullable(),
  carbsGrams: z.number().nullable(),
  fatGrams: z.number().nullable(),
  foodItems: z.array(aiFoodItemSchema).min(1),
});

export const aiMealSchema = z.object({
  name: z.string().describe("Nome da refeição: 'Café da manhã', 'Almoço', etc."),
  scheduledAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .describe("Horário sugerido no formato HH:mm"),
  options: z.array(aiMealOptionSchema).min(1),
});

export const aiDietSchema = z.object({
  dietName: z.string(),
  objective: z.string(),
  estimatedDailyCalories: z.number().int().nullable(),
  notes: z.array(z.string()).default([]),
  meals: z.array(aiMealSchema).min(3),
  shoppingList: z
    .array(z.object({ name: z.string(), quantity: z.string() }))
    .default([]),
  warnings: z.array(z.string()).default([]),
});

export type AiDietOutput = z.infer<typeof aiDietSchema>;

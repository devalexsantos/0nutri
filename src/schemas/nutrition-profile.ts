import { z } from "zod";

export const BUDGET_LEVELS = ["economico", "normal", "flexivel"] as const;
export const PREP_PREFS = ["marmita", "rapido", "caseiro", "poucas_receitas"] as const;
export const DIFFICULTIES = [
  "fome_noite",
  "beliscar",
  "doces",
  "delivery",
  "falta_tempo",
  "retencao",
  "nao_sei_o_que_comer",
] as const;

export const nutritionProfileSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  sleepTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  workRoutine: z.string().nullable().optional(),
  trainingRoutine: z.string().nullable().optional(),
  desiredMealsPerDay: z.coerce.number().int().min(2).max(8).nullable().optional(),
  mainDifficulty: z.enum(DIFFICULTIES).nullable().optional(),
  foodPreferences: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  intolerances: z.array(z.string()).default([]),
  medicalRestrictions: z.string().nullable().optional(),
  budgetLevel: z.enum(BUDGET_LEVELS).nullable().optional(),
  preparationPreference: z.enum(PREP_PREFS).nullable().optional(),
  preferredFoods: z.array(z.string()).default([]),
  showCalories: z.boolean().default(false),
  showMacros: z.boolean().default(false),
  includeShoppingList: z.boolean().default(true),
});

export type NutritionProfileInput = z.infer<typeof nutritionProfileSchema>;

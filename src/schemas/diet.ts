import { z } from "zod";

export const foodItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const mealOptionSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  calories: z.coerce.number().int().nullable().optional(),
  proteinGrams: z.coerce.number().nullable().optional(),
  carbsGrams: z.coerce.number().nullable().optional(),
  fatGrams: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  foodItems: z.array(foodItemSchema).default([]),
});

export const mealSchema = z.object({
  name: z.string().min(1),
  scheduledAt: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  description: z.string().nullable().optional(),
  options: z.array(mealOptionSchema).min(1),
});

export const dietSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  meals: z.array(mealSchema).min(1),
});

export type DietInput = z.infer<typeof dietSchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type MealOptionInput = z.infer<typeof mealOptionSchema>;
export type FoodItemInput = z.infer<typeof foodItemSchema>;

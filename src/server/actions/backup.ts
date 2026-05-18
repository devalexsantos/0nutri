"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isoDate } from "@/lib/dates";

const BACKUP_VERSION = 1;

export type PersonaBackup = {
  version: number;
  exportedAt: string;
  persona: {
    name: string;
    avatar: string | null;
    color: string | null;
    age: number | null;
    sex: string | null;
    heightCm: number | null;
    initialWeightKg: number | null;
    targetWeightKg: number | null;
    dailyWaterMl: number;
    goal: string | null;
    activityLevel: string | null;
    region: string | null;
    startDate: string | null;
  };
  nutritionProfile: Record<string, unknown> | null;
  diets: Array<{
    name: string;
    description: string | null;
    objective: string | null;
    isActive: boolean;
    startDate: string | null;
    meals: Array<{
      name: string;
      scheduledAt: string;
      description: string | null;
      sortOrder: number;
      isOptional: boolean;
      options: Array<{
        name: string;
        description: string | null;
        calories: number | null;
        proteinGrams: number | null;
        carbsGrams: number | null;
        fatGrams: number | null;
        notes: string | null;
        sortOrder: number;
        foodItems: Array<{
          name: string;
          quantity: number | null;
          unit: string | null;
          notes: string | null;
          sortOrder: number;
        }>;
      }>;
    }>;
  }>;
  weightLogs: Array<{ date: string; weightKg: number; notes: string | null }>;
  waterLogs: Array<{
    date: string;
    loggedAt: string;
    amountMl: number;
    notes: string | null;
  }>;
  dailyMealLogs: Array<{
    date: string;
    mealName: string;
    mealOptionName: string | null;
    status: string;
    hungerLevel: number | null;
    feeling: string | null;
    notes: string | null;
  }>;
  dailySummaries: Array<{
    date: string;
    mealsScore: number | null;
    waterScore: number | null;
    overallScore: number | null;
    energyLevel: number | null;
    moodLevel: number | null;
    hungerLevel: number | null;
    notes: string | null;
  }>;
  freeMeals: Array<{
    date: string;
    type: string;
    description: string | null;
    impact: string | null;
  }>;
  favoriteFoods: Array<{
    name: string;
    defaultQuantity: number | null;
    defaultUnit: string | null;
  }>;
};

export async function exportPersonaBackup(personaId: string): Promise<PersonaBackup> {
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    include: {
      nutritionProfile: true,
      diets: {
        include: {
          meals: {
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                orderBy: { sortOrder: "asc" },
                include: { foodItems: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
      weightLogs: { orderBy: { date: "asc" } },
      waterLogs: { orderBy: { loggedAt: "asc" } },
      dailyMealLogs: {
        orderBy: { date: "asc" },
        include: { meal: true, mealOption: true },
      },
      dailySummaries: { orderBy: { date: "asc" } },
      freeMeals: { orderBy: { date: "asc" } },
      favoriteFoods: { orderBy: { name: "asc" } },
    },
  });
  if (!persona) throw new Error("Persona não encontrada.");

  const backup: PersonaBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    persona: {
      name: persona.name,
      avatar: persona.avatar,
      color: persona.color,
      age: persona.age,
      sex: persona.sex,
      heightCm: persona.heightCm,
      initialWeightKg: persona.initialWeightKg,
      targetWeightKg: persona.targetWeightKg,
      dailyWaterMl: persona.dailyWaterMl,
      goal: persona.goal,
      activityLevel: persona.activityLevel,
      region: persona.region,
      startDate: persona.startDate ? persona.startDate.toISOString() : null,
    },
    nutritionProfile: persona.nutritionProfile
      ? Object.fromEntries(
          Object.entries(persona.nutritionProfile).filter(
            ([k]) => !["id", "personaId", "createdAt", "updatedAt"].includes(k)
          )
        )
      : null,
    diets: persona.diets.map((d) => ({
      name: d.name,
      description: d.description,
      objective: d.objective,
      isActive: d.isActive,
      startDate: d.startDate ? d.startDate.toISOString() : null,
      meals: d.meals.map((m) => ({
        name: m.name,
        scheduledAt: m.scheduledAt,
        description: m.description,
        sortOrder: m.sortOrder,
        isOptional: m.isOptional,
        options: m.options.map((o) => ({
          name: o.name,
          description: o.description,
          calories: o.calories,
          proteinGrams: o.proteinGrams,
          carbsGrams: o.carbsGrams,
          fatGrams: o.fatGrams,
          notes: o.notes,
          sortOrder: o.sortOrder,
          foodItems: o.foodItems.map((f) => ({
            name: f.name,
            quantity: f.quantity,
            unit: f.unit,
            notes: f.notes,
            sortOrder: f.sortOrder,
          })),
        })),
      })),
    })),
    weightLogs: persona.weightLogs.map((l) => ({
      date: isoDate(l.date),
      weightKg: l.weightKg,
      notes: l.notes,
    })),
    waterLogs: persona.waterLogs.map((l) => ({
      date: isoDate(l.date),
      loggedAt: l.loggedAt.toISOString(),
      amountMl: l.amountMl,
      notes: l.notes,
    })),
    dailyMealLogs: persona.dailyMealLogs.map((l) => ({
      date: isoDate(l.date),
      mealName: l.meal.name,
      mealOptionName: l.mealOption?.name ?? null,
      status: l.status,
      hungerLevel: l.hungerLevel,
      feeling: l.feeling,
      notes: l.notes,
    })),
    dailySummaries: persona.dailySummaries.map((s) => ({
      date: isoDate(s.date),
      mealsScore: s.mealsScore,
      waterScore: s.waterScore,
      overallScore: s.overallScore,
      energyLevel: s.energyLevel,
      moodLevel: s.moodLevel,
      hungerLevel: s.hungerLevel,
      notes: s.notes,
    })),
    freeMeals: persona.freeMeals.map((f) => ({
      date: isoDate(f.date),
      type: f.type,
      description: f.description,
      impact: f.impact,
    })),
    favoriteFoods: persona.favoriteFoods.map((f) => ({
      name: f.name,
      defaultQuantity: f.defaultQuantity,
      defaultUnit: f.defaultUnit,
    })),
  };

  return backup;
}

const importSchema = z.object({
  version: z.number().int(),
  persona: z.object({
    name: z.string().min(1),
    avatar: z.string().nullable(),
    color: z.string().nullable(),
    age: z.number().nullable(),
    sex: z.string().nullable(),
    heightCm: z.number().nullable(),
    initialWeightKg: z.number().nullable(),
    targetWeightKg: z.number().nullable(),
    dailyWaterMl: z.number().int(),
    goal: z.string().nullable(),
    activityLevel: z.string().nullable(),
    region: z.string().nullable(),
    startDate: z.string().nullable(),
  }),
  diets: z.array(z.any()).optional().default([]),
  weightLogs: z.array(z.any()).optional().default([]),
  waterLogs: z.array(z.any()).optional().default([]),
  dailyMealLogs: z.array(z.any()).optional().default([]),
  dailySummaries: z.array(z.any()).optional().default([]),
  freeMeals: z.array(z.any()).optional().default([]),
  favoriteFoods: z.array(z.any()).optional().default([]),
  nutritionProfile: z.any().nullable().optional(),
});

export async function importPersonaBackup(jsonText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON inválido.");
  }
  const data = importSchema.parse(parsed);

  const persona = await prisma.persona.create({
    data: {
      name: `${data.persona.name} (importado)`,
      avatar: data.persona.avatar,
      color: data.persona.color,
      age: data.persona.age,
      sex: data.persona.sex,
      heightCm: data.persona.heightCm,
      initialWeightKg: data.persona.initialWeightKg,
      targetWeightKg: data.persona.targetWeightKg,
      dailyWaterMl: data.persona.dailyWaterMl,
      goal: data.persona.goal,
      activityLevel: data.persona.activityLevel,
      region: data.persona.region,
      startDate: data.persona.startDate ? new Date(data.persona.startDate) : null,
    },
  });

  // NutritionProfile
  if (data.nutritionProfile && typeof data.nutritionProfile === "object") {
    const safeKeys = [
      "wakeTime",
      "sleepTime",
      "workRoutine",
      "trainingRoutine",
      "desiredMealsPerDay",
      "mainDifficulty",
      "foodPreferences",
      "dislikedFoods",
      "allergies",
      "intolerances",
      "medicalRestrictions",
      "budgetLevel",
      "preparationPreference",
      "preferredFoods",
      "showCalories",
      "showMacros",
      "includeShoppingList",
    ];
    const profileData: Record<string, unknown> = { personaId: persona.id };
    for (const k of safeKeys) {
      const v = (data.nutritionProfile as Record<string, unknown>)[k];
      if (v !== undefined) profileData[k] = v;
    }
    await prisma.nutritionProfile.create({
      data: profileData as Parameters<typeof prisma.nutritionProfile.create>[0]["data"],
    });
  }

  // Diets + Meals + Options + FoodItems
  const mealNameToId = new Map<string, string>();
  const optionNameToId = new Map<string, string>();
  for (const diet of data.diets as Array<{
    name: string;
    description: string | null;
    objective: string | null;
    isActive: boolean;
    startDate: string | null;
    meals: Array<{
      name: string;
      scheduledAt: string;
      description: string | null;
      sortOrder: number;
      isOptional: boolean;
      options: Array<{
        name: string;
        description: string | null;
        calories: number | null;
        proteinGrams: number | null;
        carbsGrams: number | null;
        fatGrams: number | null;
        notes: string | null;
        sortOrder: number;
        foodItems: Array<{
          name: string;
          quantity: number | null;
          unit: string | null;
          notes: string | null;
          sortOrder: number;
        }>;
      }>;
    }>;
  }>) {
    const createdDiet = await prisma.diet.create({
      data: {
        personaId: persona.id,
        name: diet.name,
        description: diet.description,
        objective: diet.objective,
        isActive: diet.isActive,
        startDate: diet.startDate ? new Date(diet.startDate) : null,
      },
    });
    for (const m of diet.meals) {
      const createdMeal = await prisma.meal.create({
        data: {
          dietId: createdDiet.id,
          name: m.name,
          scheduledAt: m.scheduledAt,
          description: m.description,
          sortOrder: m.sortOrder,
          isOptional: m.isOptional ?? false,
        },
      });
      mealNameToId.set(`${diet.name}|${m.name}`, createdMeal.id);
      for (const o of m.options) {
        const createdOpt = await prisma.mealOption.create({
          data: {
            mealId: createdMeal.id,
            name: o.name,
            description: o.description,
            calories: o.calories,
            proteinGrams: o.proteinGrams,
            carbsGrams: o.carbsGrams,
            fatGrams: o.fatGrams,
            notes: o.notes,
            sortOrder: o.sortOrder,
          },
        });
        optionNameToId.set(`${createdMeal.id}|${o.name}`, createdOpt.id);
        if (o.foodItems.length > 0) {
          await prisma.foodItem.createMany({
            data: o.foodItems.map((f) => ({
              mealOptionId: createdOpt.id,
              name: f.name,
              quantity: f.quantity,
              unit: f.unit,
              notes: f.notes,
              sortOrder: f.sortOrder,
            })),
          });
        }
      }
    }
  }

  // Logs simples
  for (const w of data.weightLogs as Array<{ date: string; weightKg: number; notes: string | null }>) {
    await prisma.weightLog.create({
      data: {
        personaId: persona.id,
        date: new Date(w.date),
        weightKg: w.weightKg,
        notes: w.notes,
      },
    });
  }
  for (const w of data.waterLogs as Array<{
    date: string;
    loggedAt: string;
    amountMl: number;
    notes: string | null;
  }>) {
    await prisma.waterLog.create({
      data: {
        personaId: persona.id,
        date: new Date(w.date),
        loggedAt: new Date(w.loggedAt),
        amountMl: w.amountMl,
        notes: w.notes,
      },
    });
  }
  for (const s of data.dailySummaries as Array<{
    date: string;
    mealsScore: number | null;
    waterScore: number | null;
    overallScore: number | null;
    energyLevel: number | null;
    moodLevel: number | null;
    hungerLevel: number | null;
    notes: string | null;
  }>) {
    await prisma.dailySummary.create({
      data: {
        personaId: persona.id,
        date: new Date(s.date),
        mealsScore: s.mealsScore,
        waterScore: s.waterScore,
        overallScore: s.overallScore,
        energyLevel: s.energyLevel,
        moodLevel: s.moodLevel,
        hungerLevel: s.hungerLevel,
        notes: s.notes,
      },
    });
  }
  for (const f of data.freeMeals as Array<{
    date: string;
    type: string;
    description: string | null;
    impact: string | null;
  }>) {
    await prisma.freeMeal.create({
      data: {
        personaId: persona.id,
        date: new Date(f.date),
        type: f.type,
        description: f.description,
        impact: f.impact,
      },
    });
  }
  for (const fav of data.favoriteFoods as Array<{
    name: string;
    defaultQuantity: number | null;
    defaultUnit: string | null;
  }>) {
    await prisma.favoriteFood.create({
      data: {
        personaId: persona.id,
        name: fav.name,
        defaultQuantity: fav.defaultQuantity,
        defaultUnit: fav.defaultUnit,
      },
    });
  }

  revalidatePath("/personas");
  revalidatePath("/today");
  return persona;
}

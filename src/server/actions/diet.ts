"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dietSchema, type DietInput } from "@/schemas/diet";

export async function createDiet(personaId: string, input: DietInput, activate = false) {
  const data = dietSchema.parse(input);

  if (activate) {
    await prisma.diet.updateMany({ where: { personaId, isActive: true }, data: { isActive: false } });
  }

  const diet = await prisma.diet.create({
    data: {
      personaId,
      name: data.name,
      description: data.description,
      objective: data.objective,
      isActive: activate,
      startDate: activate ? new Date() : null,
      meals: {
        create: data.meals.map((meal, mealIdx) => ({
          name: meal.name,
          scheduledAt: meal.scheduledAt,
          description: meal.description,
          sortOrder: mealIdx,
          options: {
            create: meal.options.map((opt, optIdx) => ({
              name: opt.name,
              description: opt.description,
              calories: opt.calories,
              proteinGrams: opt.proteinGrams,
              carbsGrams: opt.carbsGrams,
              fatGrams: opt.fatGrams,
              notes: opt.notes,
              sortOrder: optIdx,
              foodItems: {
                create: opt.foodItems.map((f, foodIdx) => ({
                  name: f.name,
                  quantity: f.quantity,
                  unit: f.unit,
                  notes: f.notes,
                  sortOrder: foodIdx,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/diet");
  revalidatePath("/today");
  return diet;
}

export async function activateDiet(dietId: string) {
  const diet = await prisma.diet.findUnique({ where: { id: dietId } });
  if (!diet) throw new Error("Dieta não encontrada.");
  await prisma.diet.updateMany({
    where: { personaId: diet.personaId, isActive: true },
    data: { isActive: false },
  });
  await prisma.diet.update({
    where: { id: dietId },
    data: { isActive: true, startDate: new Date() },
  });
  revalidatePath("/diet");
  revalidatePath("/today");
}

export async function deleteDiet(dietId: string) {
  await prisma.diet.delete({ where: { id: dietId } });
  revalidatePath("/diet");
  revalidatePath("/today");
}

const renameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export async function renameDiet(input: z.input<typeof renameSchema>) {
  const data = renameSchema.parse(input);
  await prisma.diet.update({
    where: { id: data.id },
    data: { name: data.name, description: data.description },
  });
  revalidatePath("/diet");
}

const mealUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  scheduledAt: z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().nullable().optional(),
});

export async function updateMeal(input: z.input<typeof mealUpdateSchema>) {
  const data = mealUpdateSchema.parse(input);
  await prisma.meal.update({
    where: { id: data.id },
    data: {
      name: data.name,
      scheduledAt: data.scheduledAt,
      description: data.description,
    },
  });
  revalidatePath("/diet");
  revalidatePath("/diet/edit");
  revalidatePath("/today");
}

export async function deleteMeal(id: string) {
  await prisma.meal.delete({ where: { id } });
  revalidatePath("/diet");
  revalidatePath("/diet/edit");
  revalidatePath("/today");
}

export async function addMeal(dietId: string, name: string, scheduledAt: string) {
  const maxOrder = await prisma.meal.aggregate({
    where: { dietId },
    _max: { sortOrder: true },
  });
  await prisma.meal.create({
    data: {
      dietId,
      name,
      scheduledAt,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      options: {
        create: [
          {
            name: "Opção 1",
            sortOrder: 0,
          },
        ],
      },
    },
  });
  revalidatePath("/diet/edit");
}

const optionUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});
export async function updateMealOption(input: z.input<typeof optionUpdateSchema>) {
  const data = optionUpdateSchema.parse(input);
  await prisma.mealOption.update({
    where: { id: data.id },
    data: { name: data.name, description: data.description },
  });
  revalidatePath("/diet");
  revalidatePath("/diet/edit");
}

export async function addMealOption(mealId: string, name: string) {
  const max = await prisma.mealOption.aggregate({
    where: { mealId },
    _max: { sortOrder: true },
  });
  await prisma.mealOption.create({
    data: {
      mealId,
      name,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/diet/edit");
}

export async function deleteMealOption(id: string) {
  await prisma.mealOption.delete({ where: { id } });
  revalidatePath("/diet/edit");
}

const foodSchema = z.object({
  mealOptionId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export async function addFoodItem(input: z.input<typeof foodSchema>) {
  const data = foodSchema.parse(input);
  const max = await prisma.foodItem.aggregate({
    where: { mealOptionId: data.mealOptionId },
    _max: { sortOrder: true },
  });
  await prisma.foodItem.create({
    data: {
      mealOptionId: data.mealOptionId,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/diet/edit");
  revalidatePath("/diet");
}

export async function deleteFoodItem(id: string) {
  await prisma.foodItem.delete({ where: { id } });
  revalidatePath("/diet/edit");
  revalidatePath("/diet");
}

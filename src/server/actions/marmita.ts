"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isoDate } from "@/lib/dates";

const marmitaSchema = z.object({
  id: z.string().optional(),
  personaId: z.string().min(1),
  weekStartDate: z.coerce.date().optional(),
  name: z.string().min(1),
  portions: z.coerce.number().int().min(1).max(30).default(5),
  protein: z.string().nullable().optional(),
  carb: z.string().nullable().optional(),
  vegetables: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function currentWeekStart(now: Date = new Date()) {
  return new Date(isoDate(startOfWeek(now, { weekStartsOn: 1 })));
}

export async function saveMealPrep(input: z.input<typeof marmitaSchema>) {
  const data = marmitaSchema.parse(input);
  const weekStart = data.weekStartDate
    ? new Date(isoDate(data.weekStartDate))
    : currentWeekStart();

  if (data.id) {
    await prisma.mealPrep.update({
      where: { id: data.id },
      data: {
        name: data.name,
        portions: data.portions,
        protein: data.protein,
        carb: data.carb,
        vegetables: data.vegetables,
        notes: data.notes,
      },
    });
  } else {
    await prisma.mealPrep.create({
      data: {
        personaId: data.personaId,
        weekStartDate: weekStart,
        name: data.name,
        portions: data.portions,
        protein: data.protein,
        carb: data.carb,
        vegetables: data.vegetables,
        notes: data.notes,
      },
    });
  }
  revalidatePath("/marmita");
}

export async function deleteMealPrep(id: string) {
  await prisma.mealPrep.delete({ where: { id } });
  revalidatePath("/marmita");
}

export async function toggleMealPrepDone(id: string) {
  const m = await prisma.mealPrep.findUnique({ where: { id } });
  if (!m) return;
  await prisma.mealPrep.update({
    where: { id },
    data: { done: !m.done },
  });
  revalidatePath("/marmita");
}

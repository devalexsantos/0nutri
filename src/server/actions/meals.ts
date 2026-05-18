"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isoDate } from "@/lib/dates";

const updateLogSchema = z.object({
  personaId: z.string().min(1),
  mealId: z.string().min(1),
  status: z.enum(["pending", "done", "skipped", "partial"]),
  mealOptionId: z.string().nullable().optional(),
  hungerLevel: z.coerce.number().int().min(1).max(5).optional(),
  feeling: z.string().optional(),
  notes: z.string().optional(),
  date: z.coerce.date().default(() => new Date()),
});

export async function setMealStatus(input: z.input<typeof updateLogSchema>) {
  const data = updateLogSchema.parse(input);
  const dateOnly = new Date(isoDate(data.date));

  const existing = await prisma.dailyMealLog.findUnique({
    where: {
      personaId_mealId_date: {
        personaId: data.personaId,
        mealId: data.mealId,
        date: dateOnly,
      },
    },
  });

  if (data.status === "pending" && existing) {
    await prisma.dailyMealLog.delete({ where: { id: existing.id } });
  } else if (data.status !== "pending") {
    await prisma.dailyMealLog.upsert({
      where: {
        personaId_mealId_date: {
          personaId: data.personaId,
          mealId: data.mealId,
          date: dateOnly,
        },
      },
      update: {
        status: data.status,
        mealOptionId: data.mealOptionId ?? null,
        hungerLevel: data.hungerLevel,
        feeling: data.feeling,
        notes: data.notes,
        completedAt: data.status === "done" ? new Date() : null,
      },
      create: {
        personaId: data.personaId,
        mealId: data.mealId,
        mealOptionId: data.mealOptionId ?? null,
        date: dateOnly,
        status: data.status,
        hungerLevel: data.hungerLevel,
        feeling: data.feeling,
        notes: data.notes,
        completedAt: data.status === "done" ? new Date() : null,
      },
    });
  }

  revalidatePath("/today");
  revalidatePath("/progress");
}

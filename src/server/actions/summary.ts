"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";

const checkinSchema = z.object({
  personaId: z.string().min(1),
  energyLevel: z.coerce.number().int().min(1).max(5).nullable().optional(),
  moodLevel: z.coerce.number().int().min(1).max(5).nullable().optional(),
  hungerLevel: z.coerce.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
  date: z.coerce.date().default(() => new Date()),
});

export async function saveDailyCheckin(input: z.input<typeof checkinSchema>) {
  const data = checkinSchema.parse(input);
  const dateOnly = dateKey(data.date);

  await prisma.dailySummary.upsert({
    where: { personaId_date: { personaId: data.personaId, date: dateOnly } },
    create: {
      personaId: data.personaId,
      date: dateOnly,
      energyLevel: data.energyLevel,
      moodLevel: data.moodLevel,
      hungerLevel: data.hungerLevel,
      notes: data.notes,
    },
    update: {
      energyLevel: data.energyLevel,
      moodLevel: data.moodLevel,
      hungerLevel: data.hungerLevel,
      notes: data.notes,
    },
  });

  revalidatePath("/today");
  revalidatePath("/progress");
}

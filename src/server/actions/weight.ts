"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";

const weightSchema = z.object({
  personaId: z.string().min(1),
  weightKg: z.coerce.number().positive().max(500),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().optional(),
});

export async function logWeight(input: z.input<typeof weightSchema>) {
  const data = weightSchema.parse(input);
  await prisma.weightLog.create({
    data: {
      personaId: data.personaId,
      weightKg: data.weightKg,
      date: dateKey(data.date),
      notes: data.notes,
    },
  });
  revalidatePath("/today");
  revalidatePath("/weight");
  revalidatePath("/progress");
}

export async function deleteWeightLog(id: string) {
  await prisma.weightLog.delete({ where: { id } });
  revalidatePath("/today");
  revalidatePath("/weight");
  revalidatePath("/progress");
}

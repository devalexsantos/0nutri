"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";

const logWaterSchema = z.object({
  personaId: z.string().min(1),
  amountMl: z.coerce.number().int().positive().max(5000),
  notes: z.string().optional(),
});

export async function logWater(input: z.input<typeof logWaterSchema>) {
  const data = logWaterSchema.parse(input);
  const now = new Date();
  await prisma.waterLog.create({
    data: {
      personaId: data.personaId,
      amountMl: data.amountMl,
      notes: data.notes,
      loggedAt: now,
      date: dateKey(now),
    },
  });
  revalidatePath("/today");
  revalidatePath("/water");
}

export async function deleteWaterLog(id: string) {
  await prisma.waterLog.delete({ where: { id } });
  revalidatePath("/today");
  revalidatePath("/water");
}

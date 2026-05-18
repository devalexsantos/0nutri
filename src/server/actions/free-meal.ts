"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";

const freeMealSchema = z.object({
  personaId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  impact: z.string().optional(),
  date: z.coerce.date().default(() => new Date()),
});

export async function logFreeMeal(input: z.input<typeof freeMealSchema>) {
  const data = freeMealSchema.parse(input);
  await prisma.freeMeal.create({
    data: {
      personaId: data.personaId,
      date: dateKey(data.date),
      type: data.type,
      description: data.description,
      impact: data.impact,
    },
  });
  revalidatePath("/today");
}

export async function deleteFreeMeal(id: string) {
  await prisma.freeMeal.delete({ where: { id } });
  revalidatePath("/today");
}

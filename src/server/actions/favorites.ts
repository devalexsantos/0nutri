"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const favoriteSchema = z.object({
  personaId: z.string().min(1),
  name: z.string().min(1),
  defaultQuantity: z.coerce.number().nullable().optional(),
  defaultUnit: z.string().nullable().optional(),
  calories: z.coerce.number().int().nullable().optional(),
  proteinGrams: z.coerce.number().nullable().optional(),
  carbsGrams: z.coerce.number().nullable().optional(),
  fatGrams: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function addFavorite(input: z.input<typeof favoriteSchema>) {
  const data = favoriteSchema.parse(input);
  await prisma.favoriteFood.create({ data });
  revalidatePath("/favorites");
}

export async function deleteFavorite(id: string) {
  await prisma.favoriteFood.delete({ where: { id } });
  revalidatePath("/favorites");
}

export async function listFavorites(personaId: string) {
  return prisma.favoriteFood.findMany({
    where: { personaId },
    orderBy: { name: "asc" },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { categorizeIngredient, deriveShoppingItems, formatQuantity } from "@/lib/shopping-list";

const addSchema = z.object({
  personaId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.string().optional(),
  category: z.string().optional(),
});

export async function addShoppingItem(input: z.infer<typeof addSchema>) {
  const data = addSchema.parse(input);
  await prisma.shoppingItem.create({
    data: {
      personaId: data.personaId,
      name: data.name,
      quantity: data.quantity || null,
      category: data.category || categorizeIngredient(data.name),
      source: "manual",
    },
  });
  revalidatePath("/shopping");
}

export async function toggleShoppingItem(id: string) {
  const current = await prisma.shoppingItem.findUnique({ where: { id } });
  if (!current) return;
  await prisma.shoppingItem.update({
    where: { id },
    data: { checked: !current.checked },
  });
  revalidatePath("/shopping");
}

export async function deleteShoppingItem(id: string) {
  await prisma.shoppingItem.delete({ where: { id } });
  revalidatePath("/shopping");
}

export async function clearCheckedShoppingItems(personaId: string) {
  await prisma.shoppingItem.deleteMany({ where: { personaId, checked: true } });
  revalidatePath("/shopping");
}

const seedSchema = z.object({
  personaId: z.string().min(1),
  multiplier: z.coerce.number().int().min(1).max(30),
});

export async function generateShoppingListFromDiet(input: z.infer<typeof seedSchema>) {
  const data = seedSchema.parse(input);
  const items = await deriveShoppingItems(data.personaId, data.multiplier);
  if (items.length === 0) {
    throw new Error("Nenhuma dieta ativa para gerar lista.");
  }
  // Limpa itens "auto" anteriores que ainda não estão marcados
  await prisma.shoppingItem.deleteMany({
    where: { personaId: data.personaId, source: "auto", checked: false },
  });
  await prisma.shoppingItem.createMany({
    data: items.map((it) => ({
      personaId: data.personaId,
      name: it.name,
      quantity: formatQuantity(it.totalQuantity, it.unit),
      category: categorizeIngredient(it.name),
      source: "auto",
    })),
  });
  revalidatePath("/shopping");
}

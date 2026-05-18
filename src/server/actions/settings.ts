"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  showCalories: z.boolean(),
  showMacros: z.boolean(),
  dayStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  dayEndTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function updateSettings(input: z.infer<typeof settingsSchema>) {
  const data = settingsSchema.parse(input);
  const existing = await prisma.appSettings.findFirst();
  if (existing) {
    await prisma.appSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.appSettings.create({ data });
  }
  revalidatePath("/settings");
  revalidatePath("/today");
}

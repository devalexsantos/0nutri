"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setActivePersonaCookie } from "@/lib/persona";
import { personaSchema } from "@/schemas/persona";
import type { PersonaInput } from "@/schemas/persona";

export async function createPersona(input: PersonaInput) {
  const data = personaSchema.parse(input);
  const persona = await prisma.persona.create({ data });
  await setActivePersonaCookie(persona.id);
  revalidatePath("/personas");
  revalidatePath("/today");
  return persona;
}

export async function updatePersona(id: string, input: PersonaInput) {
  const data = personaSchema.parse(input);
  const persona = await prisma.persona.update({ where: { id }, data });
  revalidatePath("/personas");
  revalidatePath("/today");
  return persona;
}

export async function deletePersona(id: string) {
  await prisma.persona.delete({ where: { id } });
  revalidatePath("/personas");
  revalidatePath("/today");
}

export async function switchPersona(id: string) {
  await setActivePersonaCookie(id);
  revalidatePath("/", "layout");
}

export async function switchPersonaAndRedirect(id: string, to: string = "/today") {
  await setActivePersonaCookie(id);
  redirect(to);
}

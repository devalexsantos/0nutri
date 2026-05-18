import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_KEY = "0nutri.activePersonaId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

export async function getActivePersonaId(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COOKIE_KEY)?.value;
  if (fromCookie) return fromCookie;

  // Fallback: AppSettings.activePersonaId (definido pelo seed)
  const settings = await prisma.appSettings.findFirst();
  return settings?.activePersonaId ?? null;
}

export async function getActivePersona() {
  const id = await getActivePersonaId();
  if (!id) {
    // Pega a primeira persona existente como fallback final
    const first = await prisma.persona.findFirst({ orderBy: { createdAt: "asc" } });
    return first;
  }
  return prisma.persona.findUnique({ where: { id } });
}

export async function listPersonas() {
  return prisma.persona.findMany({ orderBy: { createdAt: "asc" } });
}

export async function setActivePersonaCookie(personaId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY, personaId, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Mantém AppSettings sincronizado (única linha singleton)
  const existing = await prisma.appSettings.findFirst();
  if (existing) {
    await prisma.appSettings.update({
      where: { id: existing.id },
      data: { activePersonaId: personaId },
    });
  } else {
    await prisma.appSettings.create({ data: { activePersonaId: personaId } });
  }
}

/** Garante que existe uma persona; útil para guards em páginas. */
export async function requireActivePersona() {
  const persona = await getActivePersona();
  if (!persona) {
    throw new Error("Nenhuma persona ativa. Crie uma persona em /personas.");
  }
  return persona;
}

"use server";

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isoDate } from "@/lib/dates";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const photoTypeSchema = z.enum(["frente", "lado", "costas"]);

export async function uploadProgressPhoto(formData: FormData) {
  const personaId = String(formData.get("personaId") ?? "");
  const type = photoTypeSchema.parse(String(formData.get("type") ?? "frente"));
  const notes = String(formData.get("notes") ?? "") || null;
  const file = formData.get("file");
  const dateStr = String(formData.get("date") ?? "");
  const date = dateStr ? new Date(dateStr) : new Date();

  if (!personaId) throw new Error("personaId obrigatório.");
  if (!(file instanceof File)) throw new Error("Selecione um arquivo de imagem.");
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Arquivo muito grande (máx 8MB).");
  }

  const persona = await prisma.persona.findUnique({ where: { id: personaId } });
  if (!persona) throw new Error("Persona não encontrada.");

  const dir = path.join(UPLOAD_ROOT, personaId);
  await mkdir(dir, { recursive: true });

  const extByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extByType[file.type] ?? "bin";
  const safeName = `${isoDate(date)}-${type}-${Date.now()}.${ext}`;
  const fullPath = path.join(dir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  const imageUrl = `/uploads/${personaId}/${safeName}`;
  await prisma.progressPhoto.create({
    data: {
      personaId,
      imageUrl,
      type,
      date: new Date(isoDate(date)),
      notes,
    },
  });

  revalidatePath("/photos");
}

export async function deleteProgressPhoto(id: string) {
  const photo = await prisma.progressPhoto.findUnique({ where: { id } });
  if (!photo) return;

  // Apaga arquivo do disco se for nosso path
  if (photo.imageUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", photo.imageUrl);
    await unlink(filePath).catch(() => null);
  }

  await prisma.progressPhoto.delete({ where: { id } });
  revalidatePath("/photos");
}

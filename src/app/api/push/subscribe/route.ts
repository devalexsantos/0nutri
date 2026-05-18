import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  personaId: z.string().min(1),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const data = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      personaId: data.personaId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent,
    },
    update: {
      personaId: data.personaId,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent,
      lastSeenAt: new Date(),
      disabledAt: null,
    },
  });
  return NextResponse.json({ ok: true });
}

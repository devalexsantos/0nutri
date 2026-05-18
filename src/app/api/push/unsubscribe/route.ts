import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ endpoint: z.string().url() });

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
  await prisma.pushSubscription.updateMany({
    where: { endpoint: parsed.data.endpoint },
    data: { disabledAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

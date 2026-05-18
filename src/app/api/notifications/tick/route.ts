import { NextResponse } from "next/server";
import { runTick } from "@/lib/notifications/tick";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const expected = process.env.NOTIFICATIONS_TICK_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runTick();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

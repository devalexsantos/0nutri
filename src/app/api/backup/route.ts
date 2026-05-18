import { NextResponse } from "next/server";
import { exportPersonaBackup } from "@/server/actions/backup";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const personaId = url.searchParams.get("personaId");
  if (!personaId) {
    return NextResponse.json({ error: "personaId required" }, { status: 400 });
  }
  try {
    const data = await exportPersonaBackup(personaId);
    const json = JSON.stringify(data, null, 2);
    const filename = `0nutri-backup-${data.persona.name}-${data.exportedAt.slice(0, 10)}.json`;
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPersonas, getActivePersonaId } from "@/lib/persona";
import { SwitchPersonaButton } from "@/components/personas/SwitchPersonaButton";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  const [personas, activeId] = await Promise.all([listPersonas(), getActivePersonaId()]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-muted-foreground text-sm">
            Cada persona é um workspace independente — dieta, água, peso e progresso separados.
          </p>
        </div>
        <Button asChild>
          <Link href="/personas/new">
            <Plus className="mr-2 h-4 w-4" /> Nova
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {personas.map((p) => {
          const isActive = p.id === activeId;
          return (
            <Card key={p.id} className={isActive ? "border-primary" : undefined}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold text-white"
                    style={{ background: p.color ?? "var(--primary)" }}
                  >
                    {p.avatar ?? p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {p.targetWeightKg ? `Meta: ${p.targetWeightKg}kg` : "Sem meta de peso"}
                      {p.dailyWaterMl ? ` · ${(p.dailyWaterMl / 1000).toFixed(1)}L/dia` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!isActive && <SwitchPersonaButton personaId={p.id} />}
                  {isActive && (
                    <span className="text-primary text-xs font-medium">Ativa</span>
                  )}
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/personas/${p.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {personas.length === 0 && (
          <p className="text-muted-foreground text-sm">Nenhuma persona cadastrada.</p>
        )}
      </div>
    </div>
  );
}

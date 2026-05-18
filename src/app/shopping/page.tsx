import Link from "next/link";
import { ShoppingCart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingListClient } from "@/components/shopping/ShoppingListClient";
import { SmartShoppingButton } from "@/components/shopping/SmartShoppingButton";
import { getActivePersona } from "@/lib/persona";
import { isOpenAIConfigured } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const [items, activeDiet] = await Promise.all([
    prisma.shoppingItem.findMany({
      where: { personaId: persona.id },
      orderBy: [{ checked: "asc" }, { category: "asc" }, { name: "asc" }],
    }),
    prisma.diet.findFirst({ where: { personaId: persona.id, isActive: true } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShoppingCart className="h-5 w-5" /> Lista de compras
          </h1>
          <p className="text-muted-foreground text-sm">
            Marque itens conforme vai comprando. Gere automaticamente a partir da dieta ativa.
          </p>
        </div>
      </div>

      {!activeDiet && (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm">
            <p>Sem dieta ativa — adicione itens manualmente abaixo ou monte uma dieta primeiro.</p>
            <Link
              href="/ai-diet"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" /> Montar com IA
            </Link>
          </CardContent>
        </Card>
      )}

      <SmartShoppingButton
        personaId={persona.id}
        hasActiveDiet={Boolean(activeDiet)}
        openAiConfigured={isOpenAIConfigured()}
      />

      <ShoppingListClient
        personaId={persona.id}
        hasActiveDiet={Boolean(activeDiet)}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          category: i.category,
          checked: i.checked,
          source: i.source,
        }))}
      />
    </div>
  );
}

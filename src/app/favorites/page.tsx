import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FavoritesManager } from "@/components/favorites/FavoritesManager";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const favorites = await prisma.favoriteFood.findMany({
    where: { personaId: persona.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Heart className="h-5 w-5" /> Alimentos favoritos
        </h1>
        <p className="text-muted-foreground text-sm">
          Cadastre alimentos que você consome frequentemente para autocompletar ao montar dietas.
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Nenhum favorito ainda. Adicione abaixo.
          </CardContent>
        </Card>
      ) : null}

      <FavoritesManager
        personaId={persona.id}
        favorites={favorites.map((f) => ({
          id: f.id,
          name: f.name,
          defaultQuantity: f.defaultQuantity,
          defaultUnit: f.defaultUnit,
          notes: f.notes,
        }))}
      />
    </div>
  );
}

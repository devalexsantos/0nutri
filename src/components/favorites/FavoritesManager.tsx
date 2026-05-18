"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addFavorite, deleteFavorite } from "@/server/actions/favorites";
import { toast } from "sonner";

type Favorite = {
  id: string;
  name: string;
  defaultQuantity: number | null;
  defaultUnit: string | null;
  notes: string | null;
};

export function FavoritesManager({
  personaId,
  favorites,
}: {
  personaId: string;
  favorites: Favorite[];
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addFavorite({
          personaId,
          name: name.trim(),
          defaultQuantity: quantity ? Number(quantity) : null,
          defaultUnit: unit || null,
        });
        setName("");
        setQuantity("");
        toast.success("Adicionado.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar.");
      }
    });
  }

  return (
    <>
      <Card>
        <CardContent className="grid gap-2 py-4 sm:grid-cols-[1fr_90px_90px_auto]">
          <Input
            placeholder="Nome do alimento"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Qtd"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input placeholder="Unidade" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <Button onClick={add} disabled={pending || !name.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {favorites.length > 0 && (
        <ul className="space-y-1.5">
          {favorites.map((f) => (
            <li
              key={f.id}
              className="border-border/60 flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
            >
              <div>
                <div className="text-sm font-medium">{f.name}</div>
                {(f.defaultQuantity || f.defaultUnit) && (
                  <div className="text-muted-foreground text-xs">
                    Padrão: {f.defaultQuantity ?? "—"}
                    {f.defaultUnit ? ` ${f.defaultUnit}` : ""}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteFavorite(f.id);
                      toast.success("Removido.");
                    } catch (err) {
                      console.error(err);
                    }
                  })
                }
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

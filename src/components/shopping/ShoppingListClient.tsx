"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  addShoppingItem,
  clearCheckedShoppingItems,
  deleteShoppingItem,
  generateShoppingListFromDiet,
  toggleShoppingItem,
} from "@/server/actions/shopping";

type Item = {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  source: string | null;
};

const CATEGORY_ORDER = ["proteína", "carb", "verdura", "fruta", "outros"];

export function ShoppingListClient({
  personaId,
  items,
  hasActiveDiet,
}: {
  personaId: string;
  items: Item[];
  hasActiveDiet: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [multiplier, setMultiplier] = useState("7");
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");

  const grouped = groupByCategory(items);
  const checkedCount = items.filter((i) => i.checked).length;

  function handleGenerate() {
    startTransition(async () => {
      try {
        await generateShoppingListFromDiet({
          personaId,
          multiplier: Number(multiplier),
        });
        toast.success(`Lista gerada para ${multiplier} dia(s).`);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Erro ao gerar.");
      }
    });
  }

  function handleAdd() {
    if (!newItem.trim()) return;
    startTransition(async () => {
      try {
        await addShoppingItem({
          personaId,
          name: newItem.trim(),
          quantity: newQty.trim() || undefined,
        });
        setNewItem("");
        setNewQty("");
        toast.success("Adicionado.");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao adicionar.");
      }
    });
  }

  function handleClearChecked() {
    if (!confirm(`Remover ${checkedCount} item(ns) já comprados?`)) return;
    startTransition(async () => {
      try {
        await clearCheckedShoppingItems(personaId);
        toast.success("Itens removidos.");
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gerar da dieta ativa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1 min-w-[120px]">
            <label className="text-muted-foreground text-xs">Estimar para</label>
            <Select value={multiplier} onValueChange={(v) => v && setMultiplier(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dia</SelectItem>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={pending || !hasActiveDiet}>
            <Sparkles className="mr-2 h-4 w-4" /> Gerar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adicionar manualmente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input
            placeholder="Ex: frango"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <Input
            placeholder="Qtd (1.5kg)"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={pending || !newItem.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Lista vazia. Gere a partir da dieta ou adicione itens.
          </CardContent>
        </Card>
      ) : (
        <>
          {checkedCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {checkedCount} de {items.length} marcados
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearChecked}
                disabled={pending}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar marcados
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((category) => (
              <CategoryGroup
                key={category}
                category={category}
                items={grouped[category]!}
                pending={pending}
                startTransition={startTransition}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function CategoryGroup({
  category,
  items,
  pending,
  startTransition,
}: {
  category: string;
  items: Item[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1.5 text-[10px] uppercase tracking-wide">
        {category}
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-border/60 flex items-center gap-3 rounded-lg border bg-card p-2.5"
          >
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => toggleShoppingItem(item.id))}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                item.checked
                  ? "border-success bg-success text-success-foreground"
                  : "border-muted-foreground/40 hover:border-foreground"
              )}
            >
              {item.checked && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-sm",
                  item.checked && "text-muted-foreground line-through"
                )}
              >
                {item.name}
              </div>
              {item.quantity && (
                <div className="text-muted-foreground text-xs">{item.quantity}</div>
              )}
            </div>
            {item.source === "auto" && (
              <Badge variant="outline" className="text-[9px]">
                auto
              </Badge>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteShoppingItem(item.id))}
              className="text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function groupByCategory(items: Item[]): Record<string, Item[]> {
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    const cat = item.category ?? "outros";
    (groups[cat] ??= []).push(item);
  }
  return groups;
}

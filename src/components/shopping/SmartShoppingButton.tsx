"use client";

import { useState, useTransition } from "react";
import { Bot, Check, Loader2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  applySmartShoppingList,
  generateSmartShoppingList,
} from "@/server/actions/ai-coach";
import type { SmartShopping } from "@/schemas/ai-coach";

export function SmartShoppingButton({
  personaId,
  hasActiveDiet,
  openAiConfigured,
}: {
  personaId: string;
  hasActiveDiet: boolean;
  openAiConfigured: boolean;
}) {
  const [days, setDays] = useState("7");
  const [result, setResult] = useState<SmartShopping | null>(null);
  const [pending, startTransition] = useTransition();
  const [applying, startApply] = useTransition();

  function generate() {
    if (!openAiConfigured) {
      toast.error("Configure OPENAI_API_KEY primeiro.");
      return;
    }
    startTransition(async () => {
      try {
        const out = await generateSmartShoppingList(personaId, Number(days));
        setResult(out);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Falha ao gerar.");
      }
    });
  }

  function apply() {
    if (!result) return;
    startApply(async () => {
      try {
        await applySmartShoppingList(personaId, result.items);
        toast.success(`${result.items.length} itens adicionados à lista.`);
        setResult(null);
      } catch (err) {
        console.error(err);
        toast.error("Falha ao aplicar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="text-primary h-4 w-4" /> Gerar com IA (quantidades realistas)
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          A IA estima quantidades por embalagem (1kg, 12un, 500ml) considerando a variação entre opções.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1 min-w-[120px]">
            <label className="text-muted-foreground text-xs">Período</label>
            <Select value={days} onValueChange={(v) => v && setDays(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={pending || !hasActiveDiet || !openAiConfigured}>
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Gerar
          </Button>
        </div>

        {result && (
          <div className="border-primary/30 bg-primary/5 space-y-3 rounded-lg border p-3">
            <div>
              <Badge variant="secondary" className="text-[10px]">
                {result.items.length} itens estimados pela IA
              </Badge>
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1 text-xs">
              {result.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    <strong>{it.name}</strong>{" "}
                    <span className="text-muted-foreground">— {it.quantity}</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] capitalize">
                    {it.category}
                  </Badge>
                </li>
              ))}
            </ul>
            {result.notes.length > 0 && (
              <div className="text-muted-foreground text-[10px]">
                {result.notes.map((n, i) => (
                  <p key={i}>• {n}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={apply} disabled={applying} size="sm" className="flex-1">
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {applying ? "Aplicando…" : "Adicionar à lista"}
              </Button>
              <Button
                onClick={() => setResult(null)}
                disabled={applying}
                size="sm"
                variant="ghost"
              >
                Descartar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
